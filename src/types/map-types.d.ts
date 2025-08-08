export {};

declare global {
  interface MemoryRegion {
    name: string;
    origin: number;
    length: number;
    attributes: string;
    memory_type: string;
  }

  interface SymbolEntry {
    address: number;
    symbol: string;
  }

  interface MapEntry {
    section_full: string;
    section: string;
    address: number;
    size: number;
    file: string;
    symbols: SymbolEntry[];
    memory_region?: MemoryRegion;
  }

  interface ParseResult {
    success: boolean;
    message: string;
    filePath?: string;
    entries?: MapEntry[];
  }

  interface Window {
    electronAPI: {
      openMapDialog: () => Promise<string | null>;
      parseMapFile: (filePath: string) => Promise<MapEntry[] | { error: string }>;
    };
  }
}
