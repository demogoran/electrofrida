declare global {
  const mainApi: {
    getProcessList: () => [];
  };
}

// Adding this exports the declaration file which Typescript/CRA can now pickup:
export {};
