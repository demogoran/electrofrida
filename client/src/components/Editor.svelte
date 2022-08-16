<script lang="ts">
  import { onMount } from "svelte";
  import * as monaco from "monaco-editor";

  let containerElt;
  onMount(() => {
    self.MonacoEnvironment = {
      getWorkerUrl: function (moduleId, label) {
        if (label === "json") {
          return "./json.worker.bundle.js";
        }
        if (label === "css" || label === "scss" || label === "less") {
          return "./css.worker.bundle.js";
        }
        if (label === "html" || label === "handlebars" || label === "razor") {
          return "./html.worker.bundle.js";
        }
        if (label === "typescript" || label === "javascript") {
          return "./ts.worker.bundle.js";
        }
        return "./editor.worker.bundle.js";
      },
    };

    monaco.editor.create(containerElt, {
      value: ["function x() {", '\tconsole.log("Hello world!");', "}"].join(
        "\n"
      ),
      language: "javascript",
    });
  });
</script>

<svelte:head />
<div bind:this={containerElt} />

<style>
  div {
    width: 100%;
    height: 100%;
  }
</style>
