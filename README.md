# AéroManag — Gestion de vols (admin)

Application desktop de gestion opérationnelle pour compagnie aérienne, construite avec Electron, Angular et Prisma.

## Prérequis

- Node.js >= 18
- npm >= 9

## Installation

```bash
npm install
```

## Base de données

```bash
# Créer la base et appliquer le schéma
npx prisma migrate dev --name init

# Injecter les données de test
npx ts-node prisma/seed.ts
```

## Lancement

```bash
npm run start:dev
```

## Structure du projet

```
src/
  main/
    main.ts          ← Electron : BrowserWindow + ipcMain.handle()
    database.ts      ← Classe Database : toute la logique Prisma
  preload/
    preload.ts       ← contextBridge : expose window.api au renderer
  renderer/
    app/
      services/      ← ElectronService + un service par entité
      components/    ← Dashboard, Vols, Personnel, Réservations, Avions, Aéroports, Routes, Passagers
      shared/
        types.ts     ← Interfaces TypeScript
prisma/
  schema.prisma      ← 9 modèles SQLite
  seed.ts            ← Données de test
```

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Statistiques générales |
| `/instances` | Planification et gestion des vols |
| `/personnel` | Gestion du personnel navigant |
| `/reservations` | Gestion des réservations passagers |
| `/avions` | Gestion de la flotte |
| `/aeroports` | Gestion des aéroports |
| `/routes` | Gestion des routes |
| `/passagers` | Gestion des passagers |
| `/vols` | Gestion des vols commerciaux |