// main-process.ts
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import {MapEntry, MemoryRegion, MemoryType, SymbolEntry} from './src/types/map-types';

// ======== Parsing (TS port de ton Python) ========
function parseSymbols(symbols_raw: string): SymbolEntry[] {
  const res: SymbolEntry[] = [];
  if (!symbols_raw) return res;
  const parts = symbols_raw.split('0x');
  for (const part of parts.slice(1)) {
    const [addr_str, name] = part.trim().split(/\s+/, 2);
    if (!addr_str || !name) continue;
    const addr = parseInt('0x' + addr_str, 16);
    if (!Number.isNaN(addr)) res.push({ address: addr, symbol: name.trim() });
  }
  return res;
}

function deduceMemoryType(attrs: string): MemoryType {
  const a = attrs.toLowerCase();
  if (a === 'xr') return MemoryType.FLASH;
  if (a === 'rw' || a === 'xrw') return MemoryType.RAM;
  if (a === 'r') return MemoryType.ROM;
  return MemoryType.UNKNOWN;
}

function parseMemoryConfigs(lines: string[]): MemoryRegion[] {
  const regions: MemoryRegion[] = [];
  const pattern = /^(\S+)\s+(0x[0-9a-fA-F]+)\s+(0x[0-9a-fA-F]+)\s+(\w+)$/;
  for (const raw of lines) {
    const line = raw.trim();
    const m = line.match(pattern);
    if (!m) continue;
    const [, name, origin, length, attrs] = m;
    regions.push({
      name,
      origin: parseInt(origin, 16),
      length: parseInt(length, 16),
      attributes: attrs,
      memory_type: deduceMemoryType(attrs),
    });
  }
  return regions;
}

function mapMemoryType(section :String, memory_region?: MemoryRegion,): MemoryType {
  if(section.toLowerCase().includes("debug")){
    return MemoryType.DEBUG;
  }else{
    if (memory_region) {
      return memory_region.memory_type;
    }else {
      return MemoryType.UNKNOWN;
    }
  }
}

function parseLine(line: string, memory_regions: MemoryRegion[]): MapEntry | null {
  const m = line.match(/\s*(\.\w+(?:\.\w+)*)\s+(0x[0-9a-fA-F]+)\s+(0x[0-9a-fA-F]+)\s+(.+)/);
  if (!m) return null;

  const [, section_full, addressHex, sizeHex, file_path] = m;
  const fm = file_path.trim().match(/(.+?)(\s+0x[0-9a-fA-F]+.*)?$/);
  const real_file = fm?.[1]?.trim() || '';
  const symbols_raw = fm?.[2]?.trim() || '';

  if (real_file.includes('. = ALIGN') || symbols_raw.includes('. = ALIGN')) return null;

  const root_section = section_full.includes('.') ? `.${section_full.split('.')[1]}` : section_full;
  const address = parseInt(addressHex, 16);
  const size = parseInt(sizeHex, 16);
  const memory_region = memory_regions.find(r => address >= r.origin && address < r.origin + r.length);

  return {
    section_full,
    section: root_section,
    address,
    size,
    file: real_file,
    symbols: parseSymbols(symbols_raw),
    memory_region: memory_region,
    memory_type: mapMemoryType(root_section, memory_region)
  };
}

function preprocessLines(lines: string[]): [string[], string[]] {
  const merged: string[] = [];
  const mem: string[] = [];
  let inMem = false, header = false, current = '';

  for (let line of lines) {
    if (line.includes('Memory Configuration')) { inMem = true; continue; }
    if (inMem) {
      if (!header) { if (line.includes('Name') && line.includes('Origin') && line.includes('Length')) header = true; continue; }
      if (line.trim() === '') { inMem = false; header = false; continue; }
      mem.push(line.trim());
      continue;
    }
    if (line.startsWith(' ') && !line.trim().startsWith('.')) {
      current += ' ' + line.trim();
    } else {
      if (current) merged.push(current);
      current = line.trim();
    }
  }
  if (current) merged.push(current);
  return [merged, mem];
}

function parseMapFile(filePath: string): MapEntry[] {
  const raw = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
  const [lines, memcfg] = preprocessLines(raw);
  const regions = parseMemoryConfigs(memcfg);
  const out: MapEntry[] = [];
  for (const l of lines) {
    const r = parseLine(l, regions);
    if (r) out.push(r);
  }
  return out;
}

// ======== Electron bootstrap ========

function resolveDistIndex() {
  const root = __dirname;
  const straight = path.join(root, 'dist', 'SoftcarMapParser', 'index.html');
  const browser = path.join(root, 'dist', 'SoftcarMapParser', 'browser', 'index.html');
  if (fs.existsSync(straight)) return straight;
  if (fs.existsSync(browser)) return browser;
  throw new Error(`index.html introuvable:
  - ${straight}
  - ${browser}`);
}

const useDevServer = process.env["USE_DEV_SERVER"] === '1'; // 👈 clé

let win: BrowserWindow | null = null;
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (useDevServer) {
    win.loadURL('http://localhost:4200');
    win.webContents.openDevTools();
  } else {
    win.loadFile(resolveDistIndex());
  }

  win.on('closed', () => (win = null));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (win === null) createWindow(); });

// ======== IPC handlers ========
// Choix du fichier
ipcMain.handle('dialog:openMap', async () => {
  const res = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Map files', extensions: ['map', 'txt'] }]
  });
  if (res.canceled || res.filePaths.length === 0) return null;
  return res.filePaths[0];
});

// Parsing
ipcMain.handle('parse-map', async (_evt, filePath: string) => {
  try {
    const entries = parseMapFile(filePath); // ← ta fonction TS qui fait le boulot
    return entries; // on renvoie directement le tableau
  } catch (e: any) {
    return { error: e?.message || 'Parse failed' };
  }
});
