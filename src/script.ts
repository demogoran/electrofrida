/* eslint-disable @typescript-eslint/ban-ts-comment */
const _s = (str: string) => Memory.allocUtf8String(str);
const pmalloc = () => Memory.alloc(Process.pointerSize);
// @ts-ignore
console.log("tempUrl", tempUrl);
// @ts-ignore
const dllName = _s(tempUrl);

interface IMethods {
  [key: string]: NativeFunction<any, any>;
}

class MonoAPI {
  public methods: IMethods = {};

  private _methods = {
    mono_get_root_domain: ["pointer", [] as string[]],
    mono_domain_create: ["pointer", [] as string[]],
    mono_domain_get: ["pointer", [] as string[]],
    mono_jit_init: ["pointer", ["pointer"]],
    mono_thread_attach: ["pointer", ["pointer"]],
    mono_thread_detach: ["pointer", ["pointer"]],
    mono_domain_assembly_open: ["pointer", ["pointer", "pointer"]],
    mono_assembly_open: ["pointer", ["pointer", "pointer"]],
    mono_assembly_get_image: ["pointer", ["pointer"]],
    mono_image_open_full: ["pointer", ["pointer", "pointer", "int"]],
    mono_class_from_name: ["pointer", ["pointer", "pointer", "pointer"]],
    mono_class_get_method_from_name: ["pointer", ["pointer", "pointer", "int"]],
    mono_runtime_invoke: [
      "pointer",
      ["pointer", "pointer", "pointer", "pointer"],
    ],
    mono_class_get_methods: ["pointer", ["pointer", "pointer"]],
    mono_method_get_name: ["pointer", ["pointer"]],
    mono_class_init: ["pointer", ["pointer"]],
    mono_object_unbox: ["pointer", ["pointer"]],
    mono_assembly_close: ["pointer", ["pointer"]],
    mono_domain_create_appdomain: ["pointer", ["pointer", "pointer"]],
    mono_domain_unload: ["pointer", ["pointer"]],
    mono_domain_set: ["pointer", ["pointer"]],
  };

  constructor() {
    Object.keys(this._methods).forEach((name) => {
      // @ts-ignore
      const [ret, args] = this._methods[name];

      this.methods[name] = new NativeFunction(
        Module.findExportByName(null, name),
        ret as NativeFunctionReturnType,
        // @ts-ignore
        args
      );
    });
  }
}

const monoapi = new MonoAPI();

//START

/* const domain = monoapi.methods.mono_domain_create_appdomain(_s("Test"), NULL);
console.log(domain); */

const startApp = () => {
  const root_domain = monoapi.methods.mono_get_root_domain();
  console.log("root_domain", root_domain);
  const thread = monoapi.methods.mono_thread_attach(root_domain);
  console.log("thread", thread);
  const base_assembly = monoapi.methods.mono_assembly_open(dllName, NULL);
  console.log("base_assembly", base_assembly);
  const image = monoapi.methods.mono_assembly_get_image(base_assembly);
  console.log("image", image);

  const harmony = monoapi.methods.mono_class_from_name(
    image,
    _s(""),
    _s("HarmonyInitialPatcher")
  );
  console.log("harmony", harmony);

  console.log("harmony", harmony);
  let method;
  const iter = pmalloc();

  while (
    !(method = monoapi.methods.mono_class_get_methods(harmony, iter)).isNull()
  ) {
    console.log("METHOD IS HERE", method);
    const methodName = monoapi.methods
      .mono_method_get_name(method)
      .readUtf8String();

    console.log("methodName", methodName);
  }

  const doPatching = monoapi.methods.mono_class_get_method_from_name(
    harmony,
    _s("DoPatching"),
    0
  );

  console.log("DoPatching", doPatching);
  const res = monoapi.methods.mono_runtime_invoke(doPatching, NULL, NULL, NULL);
  console.log("invoked", res);
  console.log(monoapi.methods.mono_object_unbox(res).readInt());
};

startApp();
