import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Création de la fenêtre principale ────────────────────────────────────
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

  // En développement, on charge l'URL du serveur Angular
  if (process.env['NODE_ENV'] === 'development') {
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  registerIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  await prisma.$disconnect();
  if (process.platform !== 'darwin') app.quit();
});

// ─── Enregistrement de tous les handlers IPC ──────────────────────────────
function registerIpcHandlers(): void {
  registerStatsHandlers();
  registerInstanceVolHandlers();
  registerPersonnelHandlers();
  registerReservationHandlers();
  registerAvionHandlers();
  registerAeroportHandlers();
  registerRouteHandlers();
  registerVolHandlers();
  registerPassagerHandlers();
}

// ─── Stats Dashboard ──────────────────────────────────────────────────────
function registerStatsHandlers(): void {
  ipcMain.handle('stats:dashboard', async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Toutes les agrégations en parallèle pour optimiser les performances
      const [
        totalVols,
        avionsEnService,
        totalPersonnel,
        totalReservations,
        instancesDuJour,
      ] = await Promise.all([
        prisma.vol.count(),
        prisma.avion.count({ where: { statut: 'En service' } }),
        prisma.personnel.count(),
        prisma.reservation.count(),
        prisma.instanceVol.findMany({
          where: {
            date_depart: { gte: today, lt: tomorrow },
          },
          include: {
            vol: {
              include: {
                route: {
                  include: { depart: true, arrive: true },
                },
              },
            },
            avion: true,
            commandant: true,
            copilote: true,
            chefCabine: true,
          },
          orderBy: { heure_depart: 'asc' },
        }),
      ]);

      return {
        totalVols,
        avionsEnService,
        totalPersonnel,
        totalReservations,
        instancesDuJour,
      };
    } catch (error) {
      console.error('stats:dashboard error:', error);
      throw error;
    }
  });
}

// ─── Instances de vol ─────────────────────────────────────────────────────
function registerInstanceVolHandlers(): void {
  ipcMain.handle('instances:getAll', async () => {
    try {
      return await prisma.instanceVol.findMany({
        include: {
          vol: {
            include: {
              route: {
                include: { depart: true, arrive: true },
              },
            },
          },
          avion: true,
          commandant: true,
          copilote: true,
          chefCabine: true,
          reservations: { include: { passager: true } },
          escales: { include: { aeroport: true } },
        },
        orderBy: [{ date_depart: 'asc' }, { heure_depart: 'asc' }],
      });
    } catch (error) {
      console.error('instances:getAll error:', error);
      throw error;
    }
  });

  ipcMain.handle('instances:create', async (_event, data: {
    date_depart: string;
    date_arrivee: string;
    heure_depart: string;
    heure_arrivee: string;
    statut: string;
    id_vol: number;
    id_avion: number;
    id_commandant: number;
    id_copilote: number;
    id_chef_cabine: number;
  }) => {
    try {
      // ── Validation métier (avant tout accès Prisma) ──────────────────────
      const [avion, commandant, copilote] = await Promise.all([
        prisma.avion.findUnique({ where: { id_avion: data.id_avion } }),
        prisma.personnel.findUnique({ where: { id_personnel: data.id_commandant } }),
        prisma.personnel.findUnique({ where: { id_personnel: data.id_copilote } }),
      ]);

      if (!avion) throw new Error('Avion introuvable.');
      if (avion.statut !== 'En service') {
        throw new Error(`L'avion sélectionné est "${avion.statut}" et ne peut pas être affecté.`);
      }

      if (!commandant) throw new Error('Commandant introuvable.');
      if (commandant.role !== 'Pilote') {
        throw new Error(`${commandant.prenom} ${commandant.nom} n'est pas Pilote (rôle: ${commandant.role}).`);
      }
      if (commandant.qualification_avion !== avion.model) {
        throw new Error(
          `Le commandant ${commandant.prenom} ${commandant.nom} est qualifié sur "${commandant.qualification_avion}", pas sur "${avion.model}".`
        );
      }

      if (!copilote) throw new Error('Copilote introuvable.');
      if (copilote.role !== 'Copilote') {
        throw new Error(`${copilote.prenom} ${copilote.nom} n'est pas Copilote.`);
      }

      return await prisma.instanceVol.create({
        data: {
          date_depart: new Date(data.date_depart),
          date_arrivee: new Date(data.date_arrivee),
          heure_depart: data.heure_depart,
          heure_arrivee: data.heure_arrivee,
          statut: data.statut,
          id_vol: data.id_vol,
          id_avion: data.id_avion,
          id_commandant: data.id_commandant,
          id_copilote: data.id_copilote,
          id_chef_cabine: data.id_chef_cabine,
        },
        include: {
          vol: { include: { route: { include: { depart: true, arrive: true } } } },
          avion: true,
          commandant: true,
          copilote: true,
          chefCabine: true,
        },
      });
    } catch (error) {
      console.error('instances:create error:', error);
      throw error;
    }
  });

  ipcMain.handle('instances:update', async (_event, id: number, data: {
    statut?: string;
    heure_depart?: string;
    heure_arrivee?: string;
    date_depart?: string;
    date_arrivee?: string;
    id_avion?: number;
    id_commandant?: number;
    id_copilote?: number;
    id_chef_cabine?: number;
  }) => {
    try {
      const updateData: Record<string, unknown> = { ...data };
      if (data.date_depart) updateData['date_depart'] = new Date(data.date_depart);
      if (data.date_arrivee) updateData['date_arrivee'] = new Date(data.date_arrivee);

      return await prisma.instanceVol.update({
        where: { id_instance_vol: id },
        data: updateData,
        include: {
          vol: { include: { route: { include: { depart: true, arrive: true } } } },
          avion: true,
          commandant: true,
          copilote: true,
          chefCabine: true,
        },
      });
    } catch (error) {
      console.error('instances:update error:', error);
      throw error;
    }
  });

  ipcMain.handle('instances:delete', async (_event, id: number) => {
    try {
      // Cascade supprime réservations et escales associées
      await prisma.instanceVol.delete({ where: { id_instance_vol: id } });
      return { success: true };
    } catch (error) {
      console.error('instances:delete error:', error);
      throw error;
    }
  });
}

// ─── Personnel ────────────────────────────────────────────────────────────
function registerPersonnelHandlers(): void {
  ipcMain.handle('personnel:getAll', async () => {
    try {
      return await prisma.personnel.findMany({
        orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
      });
    } catch (error) {
      console.error('personnel:getAll error:', error);
      throw error;
    }
  });

  ipcMain.handle('personnel:create', async (_event, data: {
    nom: string;
    prenom: string;
    sexe: string;
    date_naissance: string;
    date_debut_carriere: string;
    role: string;
    qualification_avion?: string;
  }) => {
    try {
      return await prisma.personnel.create({
        data: {
          nom: data.nom,
          prenom: data.prenom,
          sexe: data.sexe,
          date_naissance: new Date(data.date_naissance),
          date_debut_carriere: new Date(data.date_debut_carriere),
          role: data.role,
          qualification_avion: data.qualification_avion ?? null,
        },
      });
    } catch (error) {
      console.error('personnel:create error:', error);
      throw error;
    }
  });

  ipcMain.handle('personnel:update', async (_event, id: number, data: {
    nom?: string;
    prenom?: string;
    sexe?: string;
    date_naissance?: string;
    date_debut_carriere?: string;
    role?: string;
    qualification_avion?: string | null;
  }) => {
    try {
      const updateData: Record<string, unknown> = { ...data };
      if (data.date_naissance) updateData['date_naissance'] = new Date(data.date_naissance);
      if (data.date_debut_carriere) updateData['date_debut_carriere'] = new Date(data.date_debut_carriere);

      return await prisma.personnel.update({
        where: { id_personnel: id },
        data: updateData,
      });
    } catch (error) {
      console.error('personnel:update error:', error);
      throw error;
    }
  });

  ipcMain.handle('personnel:delete', async (_event, id: number) => {
    try {
      await prisma.personnel.delete({ where: { id_personnel: id } });
      return { success: true };
    } catch (error) {
      console.error('personnel:delete error:', error);
      throw error;
    }
  });
}

// ─── Réservations ─────────────────────────────────────────────────────────
function registerReservationHandlers(): void {
  ipcMain.handle('reservations:getAll', async () => {
    try {
      return await prisma.reservation.findMany({
        include: {
          passager: true,
          instanceVol: {
            include: {
              vol: { include: { route: { include: { depart: true, arrive: true } } } },
            },
          },
        },
        orderBy: { id_reservation: 'desc' },
      });
    } catch (error) {
      console.error('reservations:getAll error:', error);
      throw error;
    }
  });

  ipcMain.handle('reservations:create', async (_event, data: {
    numero_siege: string;
    id_instance_vol: number;
    id_passager: number;
  }) => {
    try {
      return await prisma.reservation.create({
        data,
        include: {
          passager: true,
          instanceVol: {
            include: {
              vol: { include: { route: { include: { depart: true, arrive: true } } } },
            },
          },
        },
      });
    } catch (error: unknown) {
      // Prisma lance P2002 pour une violation de contrainte unique (doublon de siège)
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new Error(
          `Le siège ${data.numero_siege} est déjà réservé pour ce vol.`
        );
      }
      console.error('reservations:create error:', error);
      throw error;
    }
  });

  ipcMain.handle('reservations:delete', async (_event, id: number) => {
    try {
      await prisma.reservation.delete({ where: { id_reservation: id } });
      return { success: true };
    } catch (error) {
      console.error('reservations:delete error:', error);
      throw error;
    }
  });
}

// ─── Avions ───────────────────────────────────────────────────────────────
function registerAvionHandlers(): void {
  ipcMain.handle('avions:getAll', async () => {
    try {
      return await prisma.avion.findMany({ orderBy: { model: 'asc' } });
    } catch (error) {
      console.error('avions:getAll error:', error);
      throw error;
    }
  });

  ipcMain.handle('avions:create', async (_event, data: {
    model: string;
    capacite: number;
    statut: string;
    annee_mise_en_service?: string;
  }) => {
    try {
      return await prisma.avion.create({
        data: {
          model: data.model,
          capacite: data.capacite,
          statut: data.statut,
          annee_mise_en_service: data.annee_mise_en_service
            ? new Date(data.annee_mise_en_service)
            : null,
        },
      });
    } catch (error) {
      console.error('avions:create error:', error);
      throw error;
    }
  });

  ipcMain.handle('avions:update', async (_event, id: number, data: {
    model?: string;
    capacite?: number;
    statut?: string;
    annee_mise_en_service?: string | null;
  }) => {
    try {
      const updateData: Record<string, unknown> = { ...data };
      if (data.annee_mise_en_service) {
        updateData['annee_mise_en_service'] = new Date(data.annee_mise_en_service);
      }
      return await prisma.avion.update({
        where: { id_avion: id },
        data: updateData,
      });
    } catch (error) {
      console.error('avions:update error:', error);
      throw error;
    }
  });

  ipcMain.handle('avions:delete', async (_event, id: number) => {
    try {
      await prisma.avion.delete({ where: { id_avion: id } });
      return { success: true };
    } catch (error) {
      console.error('avions:delete error:', error);
      throw error;
    }
  });
}

// ─── Aéroports ────────────────────────────────────────────────────────────
function registerAeroportHandlers(): void {
  ipcMain.handle('aeroports:getAll', async () => {
    try {
      return await prisma.aeroport.findMany({ orderBy: { id_iata: 'asc' } });
    } catch (error) {
      console.error('aeroports:getAll error:', error);
      throw error;
    }
  });

  ipcMain.handle('aeroports:create', async (_event, data: {
    id_iata: string;
    nom: string;
    ville: string;
    pays: string;
    type: string;
  }) => {
    try {
      return await prisma.aeroport.create({ data });
    } catch (error) {
      console.error('aeroports:create error:', error);
      throw error;
    }
  });

  ipcMain.handle('aeroports:update', async (_event, id_iata: string, data: {
    nom?: string;
    ville?: string;
    pays?: string;
    type?: string;
  }) => {
    try {
      return await prisma.aeroport.update({ where: { id_iata }, data });
    } catch (error) {
      console.error('aeroports:update error:', error);
      throw error;
    }
  });

  ipcMain.handle('aeroports:delete', async (_event, id_iata: string) => {
    try {
      await prisma.aeroport.delete({ where: { id_iata } });
      return { success: true };
    } catch (error) {
      console.error('aeroports:delete error:', error);
      throw error;
    }
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────
function registerRouteHandlers(): void {
  ipcMain.handle('routes:getAll', async () => {
    try {
      return await prisma.route.findMany({
        include: { depart: true, arrive: true },
        orderBy: { id_route: 'asc' },
      });
    } catch (error) {
      console.error('routes:getAll error:', error);
      throw error;
    }
  });

  ipcMain.handle('routes:create', async (_event, data: {
    aeroport_depart: string;
    aeroport_arrive: string;
    distance_km?: number;
  }) => {
    try {
      return await prisma.route.create({
        data,
        include: { depart: true, arrive: true },
      });
    } catch (error) {
      console.error('routes:create error:', error);
      throw error;
    }
  });

  ipcMain.handle('routes:update', async (_event, id: number, data: {
    aeroport_depart?: string;
    aeroport_arrive?: string;
    distance_km?: number;
  }) => {
    try {
      return await prisma.route.update({
        where: { id_route: id },
        data,
        include: { depart: true, arrive: true },
      });
    } catch (error) {
      console.error('routes:update error:', error);
      throw error;
    }
  });

  ipcMain.handle('routes:delete', async (_event, id: number) => {
    try {
      await prisma.route.delete({ where: { id_route: id } });
      return { success: true };
    } catch (error) {
      console.error('routes:delete error:', error);
      throw error;
    }
  });
}

// ─── Vols ─────────────────────────────────────────────────────────────────
function registerVolHandlers(): void {
  ipcMain.handle('vols:getAll', async () => {
    try {
      return await prisma.vol.findMany({
        include: {
          route: { include: { depart: true, arrive: true } },
        },
        orderBy: { numero_vol: 'asc' },
      });
    } catch (error) {
      console.error('vols:getAll error:', error);
      throw error;
    }
  });

  ipcMain.handle('vols:create', async (_event, data: {
    numero_vol: string;
    type_de_vol?: string;
    id_route: number;
  }) => {
    try {
      return await prisma.vol.create({
        data,
        include: { route: { include: { depart: true, arrive: true } } },
      });
    } catch (error) {
      console.error('vols:create error:', error);
      throw error;
    }
  });

  ipcMain.handle('vols:update', async (_event, id: number, data: {
    numero_vol?: string;
    type_de_vol?: string;
    id_route?: number;
  }) => {
    try {
      return await prisma.vol.update({
        where: { id_vol: id },
        data,
        include: { route: { include: { depart: true, arrive: true } } },
      });
    } catch (error) {
      console.error('vols:update error:', error);
      throw error;
    }
  });

  ipcMain.handle('vols:delete', async (_event, id: number) => {
    try {
      await prisma.vol.delete({ where: { id_vol: id } });
      return { success: true };
    } catch (error) {
      console.error('vols:delete error:', error);
      throw error;
    }
  });
}

// ─── Passagers ────────────────────────────────────────────────────────────
function registerPassagerHandlers(): void {
  ipcMain.handle('passagers:getAll', async () => {
    try {
      return await prisma.passager.findMany({
        orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
      });
    } catch (error) {
      console.error('passagers:getAll error:', error);
      throw error;
    }
  });

  ipcMain.handle('passagers:create', async (_event, data: {
    nom: string;
    prenom: string;
    nationalite: string;
    date_naissance: string;
  }) => {
    try {
      return await prisma.passager.create({
        data: {
          nom: data.nom,
          prenom: data.prenom,
          nationalite: data.nationalite,
          date_naissance: new Date(data.date_naissance),
        },
      });
    } catch (error) {
      console.error('passagers:create error:', error);
      throw error;
    }
  });

  ipcMain.handle('passagers:update', async (_event, id: number, data: {
    nom?: string;
    prenom?: string;
    nationalite?: string;
    date_naissance?: string;
  }) => {
    try {
      const updateData: Record<string, unknown> = { ...data };
      if (data.date_naissance) updateData['date_naissance'] = new Date(data.date_naissance);
      return await prisma.passager.update({ where: { id_passager: id }, data: updateData });
    } catch (error) {
      console.error('passagers:update error:', error);
      throw error;
    }
  });

  ipcMain.handle('passagers:delete', async (_event, id: number) => {
    try {
      await prisma.passager.delete({ where: { id_passager: id } });
      return { success: true };
    } catch (error) {
      console.error('passagers:delete error:', error);
      throw error;
    }
  });
}
