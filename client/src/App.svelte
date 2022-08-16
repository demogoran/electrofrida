<script lang="ts">
  import Tab, { Label } from "@smui/tab";
  import TabBar from "@smui/tab-bar";
  import Logs from "src/components/Logs.svelte";
  import Processes from "src/components/Processes.svelte";

  import "src/styles/app.scss";

  let currentTab = "Processes";
  const tabs = {
    Processes: Processes,
    Logs: Logs,
  };
</script>

<main>
  <TabBar tabs={Object.keys(tabs)} let:tab bind:active={currentTab}>
    <Tab {tab}>
      <Label>{tab}</Label>
    </Tab>
  </TabBar>

  <div class="content">
    <svelte:component this={tabs[currentTab]} />
  </div>
</main>
