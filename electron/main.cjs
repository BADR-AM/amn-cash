const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// 1. Single Instance Protection: Prevent multiple app/server instances from colliding
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow;
let serverModule;

async function startBackendServer() {
  const isDev = !app.isPackaged;
  const userDataPath = app.getPath('userData');
  const dataDir = path.join(userDataPath, 'data');

  process.env.PORT = '5500';
  process.env.NODE_ENV = isDev ? 'development' : 'production';
  process.env.IS_PACKAGED = isDev ? 'false' : 'true';
  process.env.AMN_DATA_DIR = dataDir;

  try {
    const serverPath = path.join(__dirname, '../server/server.js');
    serverModule = await import(pathToFileURL(serverPath).href);
    const activePort = serverModule.getActivePort ? serverModule.getActivePort() : (process.env.ACTIVE_PORT || 5500);
    console.log(`✓ AMN Cash backend ready on port ${activePort} (isolated from other systems)`);
    return activePort;
  } catch (err) {
    console.error('Failed to import backend server directly:', err);
    return 5500;
  }
}

function createWindow() {
  const isDev = !app.isPackaged;
  const appPath = isDev ? app.getAppPath() : app.getAppPath().replace('app.asar', 'app.asar.unpacked');
  
  // Find valid icon across development, unpacked asar, and packaged resources
  let resolvedIcon = path.join(__dirname, '../build/icon.ico');
  if (!fs.existsSync(resolvedIcon)) {
    const resourceIcon = path.join(process.resourcesPath, 'icon.ico');
    if (fs.existsSync(resourceIcon)) {
      resolvedIcon = resourceIcon;
    } else {
      const unpackedIcon = path.join(appPath, 'build/icon.ico');
      if (fs.existsSync(unpackedIcon)) {
        resolvedIcon = unpackedIcon;
      }
    }
  }

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: 'AMN Cash | إدارة معاملات فودافون كاش',
    backgroundColor: '#f3f5f8',
    icon: resolvedIcon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  Menu.setApplicationMenu(null); // Clean window without old-style menus

  // Enable F12 / DevTools shortcut
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  const activePort = (serverModule && serverModule.getActivePort) 
    ? serverModule.getActivePort() 
    : (process.env.ACTIVE_PORT || 5500);

  const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:5174';

  if (isDev && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(devUrl);
  } else {
    // In production, connect directly to our isolated internal server
    const http = require('http');
    let attempts = 0;
    const maxAttempts = 30; // up to 6s

    const checkServer = () => {
      attempts++;
      http.get(`http://localhost:${activePort}/api/settings`, (res) => {
        mainWindow.loadURL(`http://localhost:${activePort}`);
      }).on('error', () => {
        if (attempts < maxAttempts) {
          setTimeout(checkServer, 150);
        } else {
          mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        }
      });
    };

    checkServer();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Focus existing window if user clicks shortcut again
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  await startBackendServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean Port Release on Quit
app.on('before-quit', async () => {
  if (serverModule && typeof serverModule.stopServer === 'function') {
    try {
      await serverModule.stopServer();
    } catch {}
  }
});
