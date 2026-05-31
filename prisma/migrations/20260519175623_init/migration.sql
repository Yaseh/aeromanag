-- CreateTable
CREATE TABLE "Aeroport" (
    "id_iata" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "pays" TEXT NOT NULL,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Avion" (
    "id_avion" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "model" TEXT NOT NULL,
    "capacite" INTEGER NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'En service',
    "annee_mise_en_service" DATETIME
);

-- CreateTable
CREATE TABLE "Personnel" (
    "id_personnel" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "sexe" TEXT NOT NULL,
    "date_naissance" DATETIME NOT NULL,
    "date_debut_carriere" DATETIME NOT NULL,
    "role" TEXT NOT NULL,
    "qualification_avion" TEXT
);

-- CreateTable
CREATE TABLE "Route" (
    "id_route" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "distance_km" INTEGER,
    "aeroport_depart" TEXT NOT NULL,
    "aeroport_arrive" TEXT NOT NULL,
    CONSTRAINT "Route_aeroport_depart_fkey" FOREIGN KEY ("aeroport_depart") REFERENCES "Aeroport" ("id_iata") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Route_aeroport_arrive_fkey" FOREIGN KEY ("aeroport_arrive") REFERENCES "Aeroport" ("id_iata") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vol" (
    "id_vol" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero_vol" TEXT NOT NULL,
    "type_de_vol" TEXT,
    "id_route" INTEGER NOT NULL,
    CONSTRAINT "Vol_id_route_fkey" FOREIGN KEY ("id_route") REFERENCES "Route" ("id_route") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstanceVol" (
    "id_instance_vol" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date_depart" DATETIME NOT NULL,
    "date_arrivee" DATETIME NOT NULL,
    "heure_depart" TEXT NOT NULL,
    "heure_arrivee" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'Prévu',
    "id_vol" INTEGER NOT NULL,
    "id_avion" INTEGER NOT NULL,
    "id_commandant" INTEGER NOT NULL,
    "id_copilote" INTEGER NOT NULL,
    "id_chef_cabine" INTEGER NOT NULL,
    CONSTRAINT "InstanceVol_id_vol_fkey" FOREIGN KEY ("id_vol") REFERENCES "Vol" ("id_vol") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InstanceVol_id_avion_fkey" FOREIGN KEY ("id_avion") REFERENCES "Avion" ("id_avion") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstanceVol_id_commandant_fkey" FOREIGN KEY ("id_commandant") REFERENCES "Personnel" ("id_personnel") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstanceVol_id_copilote_fkey" FOREIGN KEY ("id_copilote") REFERENCES "Personnel" ("id_personnel") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstanceVol_id_chef_cabine_fkey" FOREIGN KEY ("id_chef_cabine") REFERENCES "Personnel" ("id_personnel") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Escale" (
    "id_escale" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "heure_arrivee" TEXT,
    "heure_depart" TEXT,
    "id_aeroport" TEXT NOT NULL,
    "id_instance_vol" INTEGER NOT NULL,
    CONSTRAINT "Escale_id_aeroport_fkey" FOREIGN KEY ("id_aeroport") REFERENCES "Aeroport" ("id_iata") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Escale_id_instance_vol_fkey" FOREIGN KEY ("id_instance_vol") REFERENCES "InstanceVol" ("id_instance_vol") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Passager" (
    "id_passager" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nationalite" TEXT NOT NULL,
    "date_naissance" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id_reservation" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero_siege" TEXT NOT NULL,
    "id_instance_vol" INTEGER NOT NULL,
    "id_passager" INTEGER NOT NULL,
    CONSTRAINT "Reservation_id_instance_vol_fkey" FOREIGN KEY ("id_instance_vol") REFERENCES "InstanceVol" ("id_instance_vol") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reservation_id_passager_fkey" FOREIGN KEY ("id_passager") REFERENCES "Passager" ("id_passager") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_id_instance_vol_numero_siege_key" ON "Reservation"("id_instance_vol", "numero_siege");
