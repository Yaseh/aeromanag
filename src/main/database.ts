import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class Database {

  async disconnect() {
    await prisma.$disconnect();
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalVols, avionsEnService, totalPersonnel, totalReservations, instancesDuJour] = await Promise.all([
      prisma.vol.count(),
      prisma.avion.count({ where: { statut: 'En service' } }),
      prisma.personnel.count(),
      prisma.reservation.count(),
      prisma.instanceVol.findMany({
        where: { date_depart: { gte: today, lt: tomorrow } },
        include: {
          vol: { include: { route: { include: { depart: true, arrive: true } } } },
          avion: true, commandant: true, copilote: true, chefCabine: true,
        },
        orderBy: { heure_depart: 'asc' },
      }),
    ]);

    return { totalVols, avionsEnService, totalPersonnel, totalReservations, instancesDuJour };
  }

  // ── Instances de vol ───────────────────────────────────────────────────────
  async getInstances() {
    return prisma.instanceVol.findMany({
      include: {
        vol: { include: { route: { include: { depart: true, arrive: true } } } },
        avion: true, commandant: true, copilote: true, chefCabine: true,
        reservations: { include: { passager: true } },
        escales: { include: { aeroport: true } },
      },
      orderBy: [{ date_depart: 'asc' }, { heure_depart: 'asc' }],
    });
  }

  async createInstance(data: any) {
    // Validation métier avant insertion
    const [avion, commandant, copilote] = await Promise.all([
      prisma.avion.findUnique({ where: { id_avion: data.id_avion } }),
      prisma.personnel.findUnique({ where: { id_personnel: data.id_commandant } }),
      prisma.personnel.findUnique({ where: { id_personnel: data.id_copilote } }),
    ]);

    if (!avion) throw new Error('Avion introuvable.');
    if (avion.statut !== 'En service') throw new Error(`L'avion sélectionné est "${avion.statut}" et ne peut pas être affecté.`);
    if (!commandant) throw new Error('Commandant introuvable.');
    if (commandant.role !== 'Pilote') throw new Error(`${commandant.prenom} ${commandant.nom} n'est pas Pilote.`);
    if (commandant.qualification_avion !== avion.model) throw new Error(`Le commandant ${commandant.prenom} ${commandant.nom} est qualifié sur "${commandant.qualification_avion}", pas sur "${avion.model}".`);
    if (!copilote) throw new Error('Copilote introuvable.');
    if (copilote.role !== 'Copilote') throw new Error(`${copilote.prenom} ${copilote.nom} n'est pas Copilote.`);

    return prisma.instanceVol.create({
      data: {
        date_depart: new Date(data.date_depart), date_arrivee: new Date(data.date_arrivee),
        heure_depart: data.heure_depart, heure_arrivee: data.heure_arrivee,
        statut: data.statut, id_vol: data.id_vol, id_avion: data.id_avion,
        id_commandant: data.id_commandant, id_copilote: data.id_copilote, id_chef_cabine: data.id_chef_cabine,
      },
      include: {
        vol: { include: { route: { include: { depart: true, arrive: true } } } },
        avion: true, commandant: true, copilote: true, chefCabine: true,
      },
    });
  }

  async updateInstance(id: number, data: any) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.date_depart) updateData['date_depart'] = new Date(data.date_depart);
    if (data.date_arrivee) updateData['date_arrivee'] = new Date(data.date_arrivee);

    return prisma.instanceVol.update({
      where: { id_instance_vol: id },
      data: updateData,
      include: {
        vol: { include: { route: { include: { depart: true, arrive: true } } } },
        avion: true, commandant: true, copilote: true, chefCabine: true,
      },
    });
  }

  async deleteInstance(id: number) {
    await prisma.instanceVol.delete({ where: { id_instance_vol: id } });
    return { success: true };
  }

  // ── Personnel ──────────────────────────────────────────────────────────────
  async getPersonnel() {
    return prisma.personnel.findMany({ orderBy: [{ nom: 'asc' }, { prenom: 'asc' }] });
  }

  async createPersonnel(data: any) {
    return prisma.personnel.create({
      data: {
        ...data,
        date_naissance: new Date(data.date_naissance),
        date_debut_carriere: new Date(data.date_debut_carriere),
        qualification_avion: data.qualification_avion ?? null,
      },
    });
  }

  async updatePersonnel(id: number, data: any) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.date_naissance) updateData['date_naissance'] = new Date(data.date_naissance);
    if (data.date_debut_carriere) updateData['date_debut_carriere'] = new Date(data.date_debut_carriere);
    return prisma.personnel.update({ where: { id_personnel: id }, data: updateData });
  }

  async deletePersonnel(id: number) {
    await prisma.personnel.delete({ where: { id_personnel: id } });
    return { success: true };
  }

  // ── Réservations ───────────────────────────────────────────────────────────
  async getReservations() {
    return prisma.reservation.findMany({
      include: {
        passager: true,
        instanceVol: { include: { vol: { include: { route: { include: { depart: true, arrive: true } } } } } },
      },
      orderBy: { id_reservation: 'desc' },
    });
  }

  async createReservation(data: any) {
    try {
      return await prisma.reservation.create({
        data,
        include: {
          passager: true,
          instanceVol: { include: { vol: { include: { route: { include: { depart: true, arrive: true } } } } } },
        },
      });
    } catch (error: unknown) {
      // P2002 = violation de contrainte unique (siège déjà pris)
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
        throw new Error(`Le siège ${data.numero_siege} est déjà réservé pour ce vol.`);
      }
      throw error;
    }
  }

  async deleteReservation(id: number) {
    await prisma.reservation.delete({ where: { id_reservation: id } });
    return { success: true };
  }

  // ── Avions ─────────────────────────────────────────────────────────────────
  async getAvions() {
    return prisma.avion.findMany({ orderBy: { model: 'asc' } });
  }

  async createAvion(data: any) {
    return prisma.avion.create({
      data: { ...data, annee_mise_en_service: data.annee_mise_en_service ? new Date(data.annee_mise_en_service) : null },
    });
  }

  async updateAvion(id: number, data: any) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.annee_mise_en_service) updateData['annee_mise_en_service'] = new Date(data.annee_mise_en_service);
    return prisma.avion.update({ where: { id_avion: id }, data: updateData });
  }

  async deleteAvion(id: number) {
    await prisma.avion.delete({ where: { id_avion: id } });
    return { success: true };
  }

  // ── Aéroports ──────────────────────────────────────────────────────────────
  async getAeroports() {
    return prisma.aeroport.findMany({ orderBy: { id_iata: 'asc' } });
  }

  async createAeroport(data: any) {
    return prisma.aeroport.create({ data });
  }

  async updateAeroport(id_iata: string, data: any) {
    return prisma.aeroport.update({ where: { id_iata }, data });
  }

  async deleteAeroport(id_iata: string) {
    await prisma.aeroport.delete({ where: { id_iata } });
    return { success: true };
  }

  // ── Routes ─────────────────────────────────────────────────────────────────
  async getRoutes() {
    return prisma.route.findMany({ include: { depart: true, arrive: true }, orderBy: { id_route: 'asc' } });
  }

  async createRoute(data: any) {
    return prisma.route.create({ data, include: { depart: true, arrive: true } });
  }

  async updateRoute(id: number, data: any) {
    return prisma.route.update({ where: { id_route: id }, data, include: { depart: true, arrive: true } });
  }

  async deleteRoute(id: number) {
    await prisma.route.delete({ where: { id_route: id } });
    return { success: true };
  }

  // ── Vols ───────────────────────────────────────────────────────────────────
  async getVols() {
    return prisma.vol.findMany({
      include: { route: { include: { depart: true, arrive: true } } },
      orderBy: { numero_vol: 'asc' },
    });
  }

  async createVol(data: any) {
    return prisma.vol.create({ data, include: { route: { include: { depart: true, arrive: true } } } });
  }

  async updateVol(id: number, data: any) {
    return prisma.vol.update({ where: { id_vol: id }, data, include: { route: { include: { depart: true, arrive: true } } } });
  }

  async deleteVol(id: number) {
    await prisma.vol.delete({ where: { id_vol: id } });
    return { success: true };
  }

  // ── Passagers ──────────────────────────────────────────────────────────────
  async getPassagers() {
    return prisma.passager.findMany({ orderBy: [{ nom: 'asc' }, { prenom: 'asc' }] });
  }

  async createPassager(data: any) {
    return prisma.passager.create({ data: { ...data, date_naissance: new Date(data.date_naissance) } });
  }

  async updatePassager(id: number, data: any) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.date_naissance) updateData['date_naissance'] = new Date(data.date_naissance);
    return prisma.passager.update({ where: { id_passager: id }, data: updateData });
  }

  async deletePassager(id: number) {
    await prisma.passager.delete({ where: { id_passager: id } });
    return { success: true };
  }
}
