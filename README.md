# AéroManag — Gestion de vols (admin)

Application desktop de gestion opérationnelle pour compagnie aérienne, construite avec Electron, Angular 17 et Prisma.

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
npx prisma db seed
```

## Lancement

```bash
# Mode développement (Angular dev server + Electron)
npm run start:dev

# Build de production
npm run build
```

## Structure du projet

```
src/
  main/
    main.ts          ← Electron : BrowserWindow + ipcMain.handle() courts (1 ligne par handler)
    database.ts      ← Classe Database : toute la logique Prisma centralisée
  preload/
    preload.ts       ← contextBridge : expose window.api au renderer
  renderer/
    app/
      services/      ← Un service par entité (appels via window.api)
      components/    ← Dashboard, Vols, Instances, Personnel,
                        Réservations, Avions, Aéroports, Routes, Passagers
      models/        ← Interfaces TypeScript (index.ts + window.d.ts)
prisma/
  schema.prisma      ← 9 modèles SQLite avec relations et onDelete
  seed.ts            ← Données de test
schema.drawio        ← Schéma entité-relation
```

## Architecture IPC

```
Renderer (Angular)
  └── window.api.xxx.yyy()          via contextBridge (preload.ts)
        └── ipcMain.handle()        une ligne par canal (main.ts)
              └── db.method()       logique Prisma dans Database (database.ts)
```

## Injection de dépendances Angular

Tous les composants utilisent l'injection par constructeur :

```typescript
constructor(private monService: MonService, private fb: FormBuilder) {}
```

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Statistiques générales (count Prisma) |
| `/instances` | Planification et gestion des vols |
| `/personnel` | Gestion du personnel navigant |
| `/reservations` | Gestion des réservations passagers |
| `/avions` | Gestion de la flotte |
| `/aeroports` | Gestion des aéroports |
| `/routes` | Gestion des routes entre aéroports |
| `/passagers` | Gestion des passagers |
| `/vols` | Gestion des vols commerciaux |