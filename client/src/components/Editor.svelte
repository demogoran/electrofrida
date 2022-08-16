<script lang="ts">
  import { onMount } from "svelte";

  import * as monaco from "monaco-editor";
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

    Monaco = monaco;

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

    editor = monaco.editor.create(containerElt, {
      theme: "logsTheme",
      value: "",
      language: "mySpecialLanguage",
      automaticLayout: true,
      scrollbar: {
        useShadows: false,
        verticalHasArrows: true,
        horizontalHasArrows: true,
        vertical: "visible",
        horizontal: "visible",
        verticalScrollbarSize: 17,
        horizontalScrollbarSize: 17,
        arrowSize: 30,
      },
    });

    let previousLine = "";
    mainApi.readLogs((t) => {
      const text = `${t}\n`;
      if (previousLine === text) {
        return;
      }
      previousLine = text;

      const lineCount = editor.getModel().getLineCount();
      const lastLineLength = editor.getModel().getLineMaxColumn(lineCount);

      const range = new monaco.Range(
        lineCount,
        lastLineLength,
        lineCount,
        lastLineLength
      );

      editor.executeEdits("", [{ range: range, text }]);
    });

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
