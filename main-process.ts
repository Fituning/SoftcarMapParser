// main-process.ts
import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import * as url from 'url'

const isDev = !app.isPackaged
let win: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:4200')
    win.webContents.openDevTools()
  } else {
    const indexPath = url.pathToFileURL(
      path.join(__dirname, 'dist', 'SoftcarMapParser', 'index.html')
    ).toString()
    win.loadURL(indexPath)
  }

  win.on('closed', () => (win = null))
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
app.on('activate', () => win === null && createWindow())
