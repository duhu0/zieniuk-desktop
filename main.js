const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const robot = require('robotjs');

let mainWindow;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    fullscreen: false,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  });

  mainWindow.on('close', () => {
    app.quit();
  });
}

ipcMain.handle('get-screen-size', () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  return primaryDisplay.workAreaSize;
});

ipcMain.handle('set-ignore-mouse', (event, ignore) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

ipcMain.handle('hijack-mouse', async () => {
  const mouse = robot.getMousePos();
  const startX = mouse.x;
  const startY = mouse.y;
  const duration = 2500;
  const steps = 100;
  const stepTime = duration / steps;
  
  return new Promise((resolve) => {
    let step = 0;
    
    const interval = setInterval(() => {
      if (step >= steps) {
        clearInterval(interval);
        robot.moveMouse(startX, startY);
        resolve();
        return;
      }
      
      const t = (step / steps) * Math.PI * 2;
      const radius = 80;
      const x = startX + Math.sin(t) * radius;
      const y = startY + Math.sin(t * 2) * radius / 2;
      
      robot.moveMouse(Math.round(x), Math.round(y));
      
      if (mainWindow) {
        mainWindow.webContents.send('mouse-hijack-position', { x: Math.round(x), y: Math.round(y) });
      }
      
      step++;
    }, stepTime);
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});