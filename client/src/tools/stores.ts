import { writable } from "svelte/store";

const pidStore = writable(0);
const currentTabStore = writable("Processes");

export { pidStore, currentTabStore };
