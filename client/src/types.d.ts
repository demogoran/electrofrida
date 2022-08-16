declare global {
  const mainApi: {
    getProcessList: () => [];
    injectToProcess: (pid: number) => void;
  };
}

// Adding this exports the declaration file which Typescript/CRA can now pickup:
export {};
