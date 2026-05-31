import { contextBridge, ipcRenderer } from 'electron';

// Chaque méthode correspond exactement au canal enregistré dans main.ts
// Le renderer appelle window.api.xxx.yyy() — jamais ipcRenderer directement
contextBridge.exposeInMainWorld('api', {
  stats: {
    dashboard: () => ipcRenderer.invoke('stats:dashboard'),
  },

  instances: {
    getAll: () => ipcRenderer.invoke('instances:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('instances:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('instances:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('instances:delete', id),
  },

  personnel: {
    getAll: () => ipcRenderer.invoke('personnel:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('personnel:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('personnel:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('personnel:delete', id),
  },

  reservations: {
    getAll: () => ipcRenderer.invoke('reservations:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('reservations:create', data),
    delete: (id: number) => ipcRenderer.invoke('reservations:delete', id),
  },

  avions: {
    getAll: () => ipcRenderer.invoke('avions:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('avions:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('avions:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('avions:delete', id),
  },

  aeroports: {
    getAll: () => ipcRenderer.invoke('aeroports:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('aeroports:create', data),
    update: (id_iata: string, data: unknown) => ipcRenderer.invoke('aeroports:update', id_iata, data),
    delete: (id_iata: string) => ipcRenderer.invoke('aeroports:delete', id_iata),
  },

  routes: {
    getAll: () => ipcRenderer.invoke('routes:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('routes:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('routes:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('routes:delete', id),
  },

  vols: {
    getAll: () => ipcRenderer.invoke('vols:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('vols:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('vols:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('vols:delete', id),
  },

  passagers: {
    getAll: () => ipcRenderer.invoke('passagers:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('passagers:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('passagers:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('passagers:delete', id),
  },
});
