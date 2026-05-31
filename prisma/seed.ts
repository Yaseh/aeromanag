import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Nettoyage dans l'ordre inverse des dépendances FK
  await prisma.reservation.deleteMany();
  await prisma.escale.deleteMany();
  await prisma.instanceVol.deleteMany();
  await prisma.vol.deleteMany();
  await prisma.route.deleteMany();
  await prisma.aeroport.deleteMany();
  await prisma.avion.deleteMany();
  await prisma.passager.deleteMany();
  await prisma.personnel.deleteMany();

  // ─── Aéroports ────────────────────────────────────────────────────────────
  await prisma.aeroport.createMany({
    data: [
      { id_iata: 'CDG', nom: 'Aéroport Charles de Gaulle', ville: 'Paris', pays: 'France', type: 'International' },
      { id_iata: 'JFK', nom: 'John F. Kennedy International', ville: 'New York', pays: 'États-Unis', type: 'International' },
      { id_iata: 'LHR', nom: 'Heathrow Airport', ville: 'Londres', pays: 'Royaume-Uni', type: 'International' },
      { id_iata: 'DXB', nom: 'Dubai International Airport', ville: 'Dubaï', pays: 'Émirats Arabes Unis', type: 'International' },
      { id_iata: 'HND', nom: 'Tokyo Haneda Airport', ville: 'Tokyo', pays: 'Japon', type: 'International' },
    ],
  });

  // ─── Avions ───────────────────────────────────────────────────────────────
  const [a320, b737, a380, b777] = await Promise.all([
    prisma.avion.create({
      data: {
        model: 'Airbus A320',
        capacite: 180,
        statut: 'En service',
        annee_mise_en_service: new Date('2018-03-15'),
      },
    }),
    prisma.avion.create({
      data: {
        model: 'Boeing 737',
        capacite: 162,
        statut: 'En service',
        annee_mise_en_service: new Date('2019-07-22'),
      },
    }),
    prisma.avion.create({
      data: {
        model: 'Airbus A380',
        capacite: 555,
        statut: 'En maintenance',
        annee_mise_en_service: new Date('2015-11-01'),
      },
    }),
    prisma.avion.create({
      data: {
        model: 'Boeing 777',
        capacite: 396,
        statut: 'En service',
        annee_mise_en_service: new Date('2020-02-10'),
      },
    }),
  ]);

  // ─── Personnel ────────────────────────────────────────────────────────────
  const [pilote1, pilote2, pilote3, copilote1, copilote2, chef1, hotesse1, hotesse2] = await Promise.all([
    prisma.personnel.create({
      data: {
        nom: 'Martin',
        prenom: 'Jean-Pierre',
        sexe: 'M',
        date_naissance: new Date('1975-04-12'),
        date_debut_carriere: new Date('2000-06-01'),
        role: 'Pilote',
        qualification_avion: 'Airbus A320',
      },
    }),
    prisma.personnel.create({
      data: {
        nom: 'Dubois',
        prenom: 'Claire',
        sexe: 'F',
        date_naissance: new Date('1980-09-23'),
        date_debut_carriere: new Date('2005-01-15'),
        role: 'Pilote',
        qualification_avion: 'Airbus A320',
      },
    }),
    prisma.personnel.create({
      data: {
        nom: 'Bernard',
        prenom: 'Thomas',
        sexe: 'M',
        date_naissance: new Date('1978-02-07'),
        date_debut_carriere: new Date('2003-09-20'),
        role: 'Pilote',
        qualification_avion: 'Boeing 737',
      },
    }),
    prisma.personnel.create({
      data: {
        nom: 'Leroy',
        prenom: 'Mathieu',
        sexe: 'M',
        date_naissance: new Date('1985-11-30'),
        date_debut_carriere: new Date('2010-03-01'),
        role: 'Copilote',
        qualification_avion: 'Airbus A320',
      },
    }),
    prisma.personnel.create({
      data: {
        nom: 'Petit',
        prenom: 'Sophie',
        sexe: 'F',
        date_naissance: new Date('1988-06-14'),
        date_debut_carriere: new Date('2012-07-01'),
        role: 'Copilote',
        qualification_avion: 'Boeing 737',
      },
    }),
    prisma.personnel.create({
      data: {
        nom: 'Moreau',
        prenom: 'Isabelle',
        sexe: 'F',
        date_naissance: new Date('1982-03-28'),
        date_debut_carriere: new Date('2007-11-01'),
        role: 'Chef de cabine',
        qualification_avion: null,
      },
    }),
    prisma.personnel.create({
      data: {
        nom: 'Simon',
        prenom: 'Laura',
        sexe: 'F',
        date_naissance: new Date('1992-08-05'),
        date_debut_carriere: new Date('2015-04-01'),
        role: 'Hôtesse',
        qualification_avion: null,
      },
    }),
    prisma.personnel.create({
      data: {
        nom: 'Laurent',
        prenom: 'Emma',
        sexe: 'F',
        date_naissance: new Date('1994-12-19'),
        date_debut_carriere: new Date('2017-09-01'),
        role: 'Hôtesse',
        qualification_avion: null,
      },
    }),
  ]);

  // ─── Routes ───────────────────────────────────────────────────────────────
  const [routeCdgJfk, routeCdgLhr, routeLhrDxb, routeDxbHnd] = await Promise.all([
    prisma.route.create({
      data: { aeroport_depart: 'CDG', aeroport_arrive: 'JFK', distance_km: 5837 },
    }),
    prisma.route.create({
      data: { aeroport_depart: 'CDG', aeroport_arrive: 'LHR', distance_km: 344 },
    }),
    prisma.route.create({
      data: { aeroport_depart: 'LHR', aeroport_arrive: 'DXB', distance_km: 5475 },
    }),
    prisma.route.create({
      data: { aeroport_depart: 'DXB', aeroport_arrive: 'HND', distance_km: 7964 },
    }),
  ]);

  // ─── Vols ─────────────────────────────────────────────────────────────────
  const [vol1, vol2, vol3, vol4] = await Promise.all([
    prisma.vol.create({
      data: { numero_vol: 'AF001', type_de_vol: 'Long-courrier', id_route: routeCdgJfk.id_route },
    }),
    prisma.vol.create({
      data: { numero_vol: 'AF002', type_de_vol: 'Court-courrier', id_route: routeCdgLhr.id_route },
    }),
    prisma.vol.create({
      data: { numero_vol: 'AF003', type_de_vol: 'Long-courrier', id_route: routeLhrDxb.id_route },
    }),
    prisma.vol.create({
      data: { numero_vol: 'AF004', type_de_vol: 'Long-courrier', id_route: routeDxbHnd.id_route },
    }),
  ]);

  // ─── Instances de vol ─────────────────────────────────────────────────────
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const [instance1, instance2, instance3] = await Promise.all([
    // Vol aujourd'hui : CDG → JFK avec A320 et pilote1
    prisma.instanceVol.create({
      data: {
        date_depart: today,
        date_arrivee: today,
        heure_depart: '08:30',
        heure_arrivee: '11:45',
        statut: 'En cours',
        id_vol: vol1.id_vol,
        id_avion: a320.id_avion,
        id_commandant: pilote1.id_personnel,
        id_copilote: copilote1.id_personnel,
        id_chef_cabine: chef1.id_personnel,
      },
    }),
    // Vol demain : CDG → LHR avec Boeing 737 et pilote3
    prisma.instanceVol.create({
      data: {
        date_depart: tomorrow,
        date_arrivee: tomorrow,
        heure_depart: '14:15',
        heure_arrivee: '15:30',
        statut: 'Prévu',
        id_vol: vol2.id_vol,
        id_avion: b737.id_avion,
        id_commandant: pilote3.id_personnel,
        id_copilote: copilote2.id_personnel,
        id_chef_cabine: chef1.id_personnel,
      },
    }),
    // Vol après-demain : LHR → DXB avec Boeing 777 et pilote1
    prisma.instanceVol.create({
      data: {
        date_depart: dayAfter,
        date_arrivee: dayAfter,
        heure_depart: '09:00',
        heure_arrivee: '18:30',
        statut: 'Prévu',
        id_vol: vol3.id_vol,
        id_avion: b777.id_avion,
        id_commandant: pilote1.id_personnel,
        id_copilote: copilote1.id_personnel,
        id_chef_cabine: chef1.id_personnel,
      },
    }),
  ]);

  // ─── Escale (instance1 fait escale à LHR entre CDG et JFK) ───────────────
  await prisma.escale.create({
    data: {
      heure_arrivee: '09:45',
      heure_depart: '10:15',
      id_aeroport: 'LHR',
      id_instance_vol: instance1.id_instance_vol,
    },
  });

  // ─── Passagers ────────────────────────────────────────────────────────────
  const [pax1, pax2, pax3, pax4] = await Promise.all([
    prisma.passager.create({
      data: {
        nom: 'Durand',
        prenom: 'Alice',
        nationalite: 'Française',
        date_naissance: new Date('1990-05-15'),
      },
    }),
    prisma.passager.create({
      data: {
        nom: 'Smith',
        prenom: 'John',
        nationalite: 'Américaine',
        date_naissance: new Date('1985-08-22'),
      },
    }),
    prisma.passager.create({
      data: {
        nom: 'Tanaka',
        prenom: 'Yuki',
        nationalite: 'Japonaise',
        date_naissance: new Date('1995-02-10'),
      },
    }),
    prisma.passager.create({
      data: {
        nom: 'Hassan',
        prenom: 'Omar',
        nationalite: 'Émiratie',
        date_naissance: new Date('1988-11-03'),
      },
    }),
  ]);

  // ─── Réservations ─────────────────────────────────────────────────────────
  await Promise.all([
    prisma.reservation.create({
      data: {
        numero_siege: '12A',
        id_instance_vol: instance1.id_instance_vol,
        id_passager: pax1.id_passager,
      },
    }),
    prisma.reservation.create({
      data: {
        numero_siege: '12B',
        id_instance_vol: instance1.id_instance_vol,
        id_passager: pax2.id_passager,
      },
    }),
    prisma.reservation.create({
      data: {
        numero_siege: '5C',
        id_instance_vol: instance2.id_instance_vol,
        id_passager: pax3.id_passager,
      },
    }),
    prisma.reservation.create({
      data: {
        numero_siege: '22D',
        id_instance_vol: instance3.id_instance_vol,
        id_passager: pax4.id_passager,
      },
    }),
  ]);

  console.log('Seed terminé avec succès.');
  console.log(`  - 5 aéroports, 4 avions, 8 membres du personnel`);
  console.log(`  - 4 routes, 4 vols, 3 instances de vol`);
  console.log(`  - 4 passagers, 4 réservations, 1 escale`);
}

main()
  .catch((error) => {
    console.error('Erreur lors du seed :', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
