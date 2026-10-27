const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function startBackendServer() {
  const isDev = !app.isPackaged;
  const appPath = isDev ? app.getAppPath() : app.getAppPath().replace('app.asar', 'app.asar.unpacked');
  const serverScript = path.join(appPath, 'server/server.js');
  
  // Use Electron's own built-in Node.js runtime so NO external Node.js installation is needed!
  const nodeBinary = isDev ? 'node' : process.execPath;
  const userDataPath = app.getPath('userData');
  const dataDir = path.join(userDataPath, 'data');

  const env = {
    ...process.env,
    PORT: '5500',
    NODE_ENV: isDev ? 'development' : 'production',
    IS_PACKAGED: isDev ? 'false' : 'true',
    AMN_DATA_DIR: dataDir,
    ELECTRON_RUN_AS_NODE: '1'
  };

  serverProcess = spawn(nodeBinary, [serverScript], {
    stdio: 'ignore', // Keep clean, no black cmd popup in production
    env,
    windowsHide: true
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to spawn background server:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: 'AMN Cash | إدارة معاملات فودافون كاش',
    backgroundColor: '#f3f5f8',
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

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:5174';

  if (isDev && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(devUrl);
  } else {
    // In production, poll until embedded server is ready, then load seamlessly
    const http = require('http');
    let attempts = 0;
    const maxAttempts = 30; // up to 6s

    const checkServer = () => {
      attempts++;
      http.get('http://localhost:5500/api/settings', (res) => {
        mainWindow.loadURL('http://localhost:5500');
      }).on('error', () => {
        if (attempts < maxAttempts) {
          setTimeout(checkServer, 200);
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

app.whenReady().then(() => {
  startBackendServer();
  // Small delay to allow express server to bind port
  setTimeout(createWindow, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) {
      serverProcess.kill();
    }
    app.quit();
  }
});

app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
