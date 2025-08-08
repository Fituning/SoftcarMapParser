export {};

declare global {
  interface Window {
    electronAPI: {
      openMapDialog: () => Promise<string | null>;
      parseMapFile: (filePath: string) => Promise<any>; // tu mettras un vrai type MapEntry[] après
    };
  }
}
