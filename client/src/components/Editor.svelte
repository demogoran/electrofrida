<script lang="ts">
  import { onMount } from "svelte";

  import type monaco from "monaco-editor";
  import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
  import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
  import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
  import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
  import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

  let containerElt: HTMLDivElement = null;
  let editor: monaco.editor.IStandaloneCodeEditor;
  let Monaco;

  onMount(async () => {
    // @ts-ignore
    self.MonacoEnvironment = {
      getWorker: function (_moduleId: any, label: string) {
        if (label === "json") {
          return new jsonWorker();
        }
        if (label === "css" || label === "scss" || label === "less") {
          return new cssWorker();
        }
        if (label === "html" || label === "handlebars" || label === "razor") {
          return new htmlWorker();
        }
        if (label === "typescript" || label === "javascript") {
          return new tsWorker();
        }
        return new editorWorker();
      },
    };

    Monaco = await import("monaco-editor");

    // Register a new language
    Monaco.languages.register({ id: "mySpecialLanguage" });

    // Register a tokens provider for the language
    Monaco.languages.setMonarchTokensProvider("mySpecialLanguage", {
      tokenizer: {
        root: [
          [/\[error.*/, "custom-error"],
          [/\[notice.*/, "custom-notice"],
          [/\[info.*/, "custom-info"],
          [/\[[a-zA-Z 0-9:]+\]/, "custom-date"],
        ],
      },
    });

    // Define a new theme that contains only rules that match this language
    Monaco.editor.defineTheme("logsTheme", {
      base: "vs",
      inherit: false,
      rules: [
        { token: "custom-info", foreground: "808080" },
        { token: "custom-error", foreground: "ff0000", fontStyle: "bold" },
        { token: "custom-notice", foreground: "FFA500" },
        { token: "custom-date", foreground: "008800" },
      ],
      colors: {
        "editor.foreground": "#000000",
      },
    });

    // Register a completion item provider for the new language
    Monaco.languages.registerCompletionItemProvider("mySpecialLanguage", {
      provideCompletionItems: () => {
        var suggestions = [
          {
            label: "simpleText",
            kind: Monaco.languages.CompletionItemKind.Text,
            insertText: "simpleText",
          },
          {
            label: "testing",
            kind: Monaco.languages.CompletionItemKind.Keyword,
            insertText: "testing(${1:condition})",
            insertTextRules:
              Monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          },
          {
            label: "ifelse",
            kind: Monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              "if (${1:condition}) {",
              "\t$0",
              "} else {",
              "\t",
              "}",
            ].join("\n"),
            insertTextRules:
              Monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "If-Else Statement",
          },
        ];
        return { suggestions: suggestions };
      },
    });

    editor = Monaco.editor.create(containerElt, {
      theme: "logsTheme",
      value: getCode(),
      language: "mySpecialLanguage",
    });

    window.addEventListener(
      "message",
      (event) => {
        if (event?.data?.type === "sendLogLine") {
          console.log(event?.data?.text);
          const selection = editor.getSelection();
          const id = { major: 1, minor: 1 };
          const text = event?.data?.text;
          const op = {
            identifier: id,
            range: selection,
            text: text,
            forceMoveMarkers: true,
          };
          editor.executeEdits("my-source", [op]);
        }
      },
      false
    );

    function getCode() {
      return [
        "[Sun Mar 7 16:02:00 2004] [notice] Apache/1.3.29 (Unix) configured -- resuming normal operations",
        "[Sun Mar 7 16:02:00 2004] [info] Server built: Feb 27 2004 13:56:37",
        "[Sun Mar 7 16:02:00 2004] [notice] Accept mutex: sysvsem (Default: sysvsem)",
      ].join("\n");
    }

    return () => {
      editor.dispose();
    };
  });
</script>

<div class="container" bind:this={containerElt} />

<style>
  .container {
    width: 100vw;
    height: 100vh;
  }
</style>
