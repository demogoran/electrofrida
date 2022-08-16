<script lang="ts">
  import Tab, { Label } from "@smui/tab";
  import TabBar from "@smui/tab-bar";
  import Logs from "src/components/Logs.svelte";
  import Processes from "src/components/Processes.svelte";

  import "src/styles/app.scss";
  import { currentTabStore, pidStore } from "./tools/stores";

  const tabs = {
    Processes: { component: Processes, disabled: false },
    Logs: { component: Logs, disabled: !$pidStore },
  };
</script>

<main>
  <TabBar tabs={Object.keys(tabs)} let:tab bind:active={$currentTabStore}>
    <Tab {tab} disabled={tabs[tab].disabled}>
      <Label>{tab}</Label>
    </Tab>
  </TabBar>

  <div class="content">
    <svelte:component this={tabs[$currentTabStore].component} />
  </div>
</main>
