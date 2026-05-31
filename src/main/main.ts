import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { Database } from './database';

const db = new Database();

// ─── Fenêtre principale ───────────────────────────────────────────────────
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env['NODE_ENV'] === 'development') {
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  await db.disconnect();
  if (process.platform !== 'darwin') app.quit();
});

// ─── Stats ────────────────────────────────────────────────────────────────
ipcMain.handle('stats:dashboard', () => db.getStats());

// ─── Instances de vol ─────────────────────────────────────────────────────
ipcMain.handle('instances:getAll',    ()           => db.getInstances());
ipcMain.handle('instances:create',   (_e, data)   => db.createInstance(data));
ipcMain.handle('instances:update',   (_e, id, data) => db.updateInstance(id, data));
ipcMain.handle('instances:delete',   (_e, id)     => db.deleteInstance(id));

// ─── Personnel ────────────────────────────────────────────────────────────
ipcMain.handle('personnel:getAll',   ()           => db.getPersonnel());
ipcMain.handle('personnel:create',   (_e, data)   => db.createPersonnel(data));
ipcMain.handle('personnel:update',   (_e, id, data) => db.updatePersonnel(id, data));
ipcMain.handle('personnel:delete',   (_e, id)     => db.deletePersonnel(id));

// ─── Réservations ─────────────────────────────────────────────────────────
ipcMain.handle('reservations:getAll',  ()         => db.getReservations());
ipcMain.handle('reservations:create', (_e, data)  => db.createReservation(data));
ipcMain.handle('reservations:delete', (_e, id)    => db.deleteReservation(id));

// ─── Avions ───────────────────────────────────────────────────────────────
ipcMain.handle('avions:getAll',   ()             => db.getAvions());
ipcMain.handle('avions:create',   (_e, data)     => db.createAvion(data));
ipcMain.handle('avions:update',   (_e, id, data) => db.updateAvion(id, data));
ipcMain.handle('avions:delete',   (_e, id)       => db.deleteAvion(id));

// ─── Aéroports ────────────────────────────────────────────────────────────
ipcMain.handle('aeroports:getAll',   ()             => db.getAeroports());
ipcMain.handle('aeroports:create',   (_e, data)     => db.createAeroport(data));
ipcMain.handle('aeroports:update',   (_e, id, data) => db.updateAeroport(id, data));
ipcMain.handle('aeroports:delete',   (_e, id)       => db.deleteAeroport(id));

// ─── Routes ───────────────────────────────────────────────────────────────
ipcMain.handle('routes:getAll',   ()             => db.getRoutes());
ipcMain.handle('routes:create',   (_e, data)     => db.createRoute(data));
ipcMain.handle('routes:update',   (_e, id, data) => db.updateRoute(id, data));
ipcMain.handle('routes:delete',   (_e, id)       => db.deleteRoute(id));

// ─── Vols ─────────────────────────────────────────────────────────────────
ipcMain.handle('vols:getAll',   ()             => db.getVols());
ipcMain.handle('vols:create',   (_e, data)     => db.createVol(data));
ipcMain.handle('vols:update',   (_e, id, data) => db.updateVol(id, data));
ipcMain.handle('vols:delete',   (_e, id)       => db.deleteVol(id));

// ─── Passagers ────────────────────────────────────────────────────────────
ipcMain.handle('passagers:getAll',   ()             => db.getPassagers());
ipcMain.handle('passagers:create',   (_e, data)     => db.createPassager(data));
ipcMain.handle('passagers:update',   (_e, id, data) => db.updatePassager(id, data));
ipcMain.handle('passagers:delete',   (_e, id)       => db.deletePassager(id));
