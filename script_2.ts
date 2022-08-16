// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// Constants
const kIgnoreArg = "-";

// Utils
function pmalloc() {
  return Memory.alloc(Process.pointerSize);
}
function debug(...args) {
  console.log(args.join(" "));
}
// Globals
const Metadata = {}; // < className, { pointer, methods < methodName, { pointer, args[], returnType } >, fields } >
const Global = {}; // save global variables across hooks
const MonoApi = {
  mono_image_get_table_rows: ["int", ["MonoImage*", "int" /*table_id*/]],
  mono_class_get: ["MonoClass*", ["MonoImage*", "int" /*type_token*/]],
  mono_class_get_parent: ["MonoClass*", ["MonoClass*"]],
  mono_class_get_name: ["char*", ["MonoClass*"]],
  mono_method_get_name: ["char*", ["MonoMethod*"]],
  mono_class_get_methods: ["MonoMethod*", ["MonoClass*", "iter*"]],
  mono_class_get_fields: ["MonoClassField*", ["MonoClass*", "iter*"]],
  mono_signature_get_params: ["MonoType*", ["MonoMethod*", "iter*"]],
  mono_field_full_name: ["char*", ["MonoField*"]],
  mono_class_get_namespace: ["char*", ["MonoClass*"]],
  mono_type_full_name: ["char*", ["MonoType*"]],
  mono_signature_get_return_type: ["MonoType*", ["MonoMethodSignature*"]],
  mono_class_get_method_from_name: [
    "MonoMethod*",
    ["MonoClass*", "name*", "int" /*number of params. -1 for any*/],
  ],
  mono_method_signature: ["MonoMethodSignature*", ["MonoMethod*"]],
  /** gpointer mono_compile_method (MonoMethod *method)
   * http://docs.go-mono.com/index.aspx?link=xhtml%3Adeploy%2Fmono-api-unsorted.html */
  mono_compile_method: [
    "gpointer*" /* pointer to the native code produced.*/,
    ["MonoMethod*"],
  ],
  /**
     * char* mono_string_to_utf8 (MonoString *s)
     * @param    s	a System.String
     * @Description
     # TODO mono_free
     *       Returns the UTF8 representation for s. The resulting buffer needs to be freed with mono_free().
     *       deprecated Use mono_string_to_utf8_checked to avoid having an exception arbritraly raised.
     */
  mono_string_to_utf8: ["char*", ["System.String*"]],
  getClassMethods: function (klass) {
    let method,
      methods = {},
      iter = pmalloc();

    while (!(method = MonoApi.mono_class_get_methods(klass, iter)).isNull()) {
      console.log(123);
      const methodName = MonoApi.mono_method_get_name(method).readUtf8String();
      if (!methodName.startsWith("<") /*|| methodName.startsWith('.')*/) {
        const methodRef = MonoApi.mono_class_get_method_from_name(
          klass,
          Memory.allocUtf8String(methodName),
          -1
        );
        const monoSignature = MonoApi.mono_method_signature(methodRef);
        const retType = MonoApi.mono_type_full_name(
          MonoApi.mono_signature_get_return_type(monoSignature)
        ).readUtf8String();
        const args = MonoApi.getSignatureParams(monoSignature);
        methods[methodName] = { ref: methodRef, args: args, ret: retType };
      }
    }

    return methods;
  },
  getSignatureParams: function (monoSignature) {
    let params,
      fields = [],
      iter = pmalloc();

    while (
      !(params = MonoApi.mono_signature_get_params(
        monoSignature,
        iter
      )).isNull()
    )
      fields.push(MonoApi.mono_type_full_name(params).readUtf8String());

    return fields;
  },
  getClassFields: function (monoClass) {
    let field,
      fields = [],
      iter = pmalloc();

    while (!(field = MonoApi.mono_class_get_fields(monoClass, iter)).isNull())
      fields.push(
        MonoApi.mono_field_full_name(field).readUtf8String().split(":")[1]
      );

    return fields;
  },
  init: function () {
    let monoModule = Process.findModuleByName("mono.dll");
    debug("Process.findModuleByName('mono.dll') ? " + monoModule);
    if (!monoModule) {
      const monoThreadAttach = Module.findExportByName(
        null,
        "mono_thread_attach"
      );
      debug("monoThreadAttach ? " + monoThreadAttach);
      if (monoThreadAttach)
        monoModule = Process.findModuleByAddress(monoThreadAttach);
    }
    if (!monoModule) throw new Error("Mono.dll not found");

    Object.keys(MonoApi).map(function (exportName) {
      const monoApiIter = MonoApi[exportName];
      if (typeof monoApiIter === "object") {
        const returnValue = monoApiIter[0].endsWith("*")
          ? "pointer"
          : monoApiIter[0];
        const argumentTypes = monoApiIter[1].map(function (t) {
          return t.endsWith("*") ? "pointer" : t;
        });
        const exportAddress = Module.findExportByName(
          monoModule.name,
          exportName
        );
        MonoApi[exportName] = new NativeFunction(
          exportAddress,
          returnValue,
          argumentTypes
        );
      }
    });
  },
};

function getMetadata(monoImage) {
  // MONO_TABLE_TYPEDEF = 0x2; // https://github.com/mono/mono/blob/master/mono/metadata/blob.h#L56
  for (
    let i = 1, l = MonoApi.mono_image_get_table_rows(monoImage, 0x2);
    i < l;
    ++i
  ) {
    try {
      console.log(i, l);
      // MONO_TOKEN_TYPE_DEF = 0x2000000 // https://github.com/mono/mono/blob/master/mono/metadata/tokentype.h#L16
      const mClass = MonoApi.mono_class_get(monoImage, 0x2000000 | i);
      console.log("mClass", mClass);

      const className = MonoApi.mono_class_get_name(mClass).readUtf8String();
      console.log("className", className);
      if (1 === 1) continue;

      console.log(
        "namespace pointer",
        MonoApi.mono_class_get_namespace(mClass).readUtf8String()
      );

      const classNameSpace =
        MonoApi.mono_class_get_namespace(mClass).readUtf8String();
      console.log("classNameSpace", classNameSpace);

      const parentClassName = MonoApi.mono_class_get_name(
        MonoApi.mono_class_get_parent(mClass)
      ).readUtf8String();
      if (parentClassName === "MonoBehaviour" && classNameSpace === "") {
        Metadata[className] = {
          // namespace: classNameSpace,
          ref: mClass,
          methods: MonoApi.getClassMethods(mClass),
          fields: MonoApi.getClassFields(mClass),
        };
      }
    } catch (e) {
      debug("Error @ getMetadata/mono_class_get_parent", e);
      Metadata[className] = {
        // namespace: classNameSpace,
        ref: mClass,
        methods: MonoApi.getClassMethods(mClass),
        fields: MonoApi.getClassFields(mClass),
      };
    }
  }
  return Metadata;
}

const _s1 = (str: string) => Memory.allocUtf8String(str);

const mono_get_root_domain1 = new NativeFunction(
  Module.findExportByName(null, "mono_get_root_domain"),
  "pointer",
  []
);
const mono_thread_attach1 = new NativeFunction(
  Module.findExportByName(null, "mono_thread_attach"),
  "pointer",
  ["pointer"]
);
const mono_image_open_full1 = new NativeFunction(
  Module.findExportByName(null, "mono_image_open_full"),
  "pointer",
  ["pointer", "pointer", "int"]
);

console.log(
  "domain_assembly_open",
  Module.findExportByName(null, "mono_domain_assembly_open")
);
const domain_assembly_open = new NativeFunction(
  Module.findExportByName(null, "mono_domain_assembly_open"),
  "pointer",
  ["pointer", "pointer"]
);
const assembly_get_image = new NativeFunction(
  Module.findExportByName(null, "mono_assembly_get_image"),
  "pointer",
  ["pointer"]
);

const root_domain = mono_get_root_domain1();
mono_thread_attach1(root_domain);

const base_assembly = domain_assembly_open(
  root_domain,
  _s1("C:/Projects/electrofrida/dn/bin/Debug/net6.0/dn.dll")
);
console.log("base_assembly", base_assembly);
const image = assembly_get_image(base_assembly);
console.log("image", image);
MonoApi.init();
//getMetadata(image);

/* setTimeout(() => {
  console.log("Start");
  console.log(JSON.stringify(getMetadata(image)));
}, 3000);
 */
