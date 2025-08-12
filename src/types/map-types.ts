

export interface MemoryRegion {
  name: string;
  origin: number;
  length: number;
  attributes: string;
  memory_type: MemoryType;
}

export interface SymbolEntry {
  address: number;
  symbol: string;
}

export interface MapEntry {
  section_full: string;
  section: string;
  address: number;
  size: number;
  file: string;
  symbols: SymbolEntry[];
  memory_region?: MemoryRegion;
  memory_type : MemoryType
}

export interface ParseResult {
  success: boolean;
  message: string;
  filePath?: string;
  entries?: MapEntry[];
}

export interface Window {
  electronAPI: {
    openMapDialog: () => Promise<string | null>;
    parseMapFile: (filePath: string) => Promise<MapEntry[] | { error: string }>;
  };
}

export enum MemoryType {
  FLASH = 'FLASH',
  RAM = 'RAM',
  ROM = 'ROM',
  UNKNOWN = 'UNKNOWN',
  DEBUG = 'DEBUG'
}
