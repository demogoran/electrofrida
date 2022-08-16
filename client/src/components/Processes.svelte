<script lang="ts">
  import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
  import TextField from "@smui/textfield";
  import Icon from "@smui/textfield/icon";
  import HelperText from "@smui/textfield/helper-text";
  import { currentTabStore, pidStore } from "src/tools/stores";

  let processList = [];
  let filteredProcessList = [];
  let search = "Star Valor";
  (async () => {
    processList = await mainApi.getProcessList();
    filteredProcessList = processList;
  })();

  const setActiveProcess = (process) => {
    $pidStore = process.pid;
    $currentTabStore = "Logs";

    mainApi.injectToProcess(process.pid);
  };

  $: {
    search;
    (() => {
      filteredProcessList = processList.filter(
        (x) =>
          x.name.toLowerCase().includes(search.toLowerCase()) && x.pid > 100
      );
    })();
  }
</script>

<main>
  <TextField bind:value={search} label="Leading Icon">
    <Icon class="material-icons" slot="leadingIcon">search</Icon>
    <HelperText slot="helper">Helper Text</HelperText>
  </TextField>
  <DataTable table$aria-label="Process list" class="dataTable">
    <Head>
      <Row>
        <Cell>Process ID</Cell>
        <Cell>Name</Cell>
      </Row>
    </Head>
    <Body>
      {#each filteredProcessList as process}
        <Row on:click={() => setActiveProcess(process)}>
          <Cell>{process.pid}</Cell>
          <Cell>{process.name}</Cell>
        </Row>
      {/each}
    </Body>
  </DataTable>
</main>
