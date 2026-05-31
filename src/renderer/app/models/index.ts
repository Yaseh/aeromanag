// Interfaces TypeScript correspondant exactement aux modèles Prisma
// Pas de "any" — chaque entité retournée par l'IPC est typée ici

export interface Aeroport {
  id_iata: string;
  nom: string;
  ville: string;
  pays: string;
  type: string;
}

export interface Avion {
  id_avion: number;
  model: string;
  capacite: number;
  statut: string;
  annee_mise_en_service: string | null;
}

export interface Personnel {
  id_personnel: number;
  nom: string;
  prenom: string;
  sexe: string;
  date_naissance: string;
  date_debut_carriere: string;
  role: string;
  qualification_avion: string | null;
}

export interface Route {
  id_route: number;
  distance_km: number | null;
  aeroport_depart: string;
  aeroport_arrive: string;
  depart?: Aeroport;
  arrive?: Aeroport;
}

export interface Vol {
  id_vol: number;
  numero_vol: string;
  type_de_vol: string | null;
  id_route: number;
  route?: Route;
}

export type StatutVol = 'Prévu' | 'En cours' | 'Atterri' | 'Annulé';

export interface InstanceVol {
  id_instance_vol: number;
  date_depart: string;
  date_arrivee: string;
  heure_depart: string;
  heure_arrivee: string;
  statut: StatutVol;
  id_vol: number;
  id_avion: number;
  id_commandant: number;
  id_copilote: number;
  id_chef_cabine: number;
  vol?: Vol;
  avion?: Avion;
  commandant?: Personnel;
  copilote?: Personnel;
  chefCabine?: Personnel;
  reservations?: Reservation[];
  escales?: Escale[];
}

export interface Passager {
  id_passager: number;
  nom: string;
  prenom: string;
  nationalite: string;
  date_naissance: string;
}

export interface Reservation {
  id_reservation: number;
  numero_siege: string;
  id_instance_vol: number;
  id_passager: number;
  passager?: Passager;
  instanceVol?: InstanceVol;
}

export interface Escale {
  id_escale: number;
  heure_arrivee: string | null;
  heure_depart: string | null;
  id_aeroport: string;
  id_instance_vol: number;
  aeroport?: Aeroport;
}

export interface DashboardStats {
  totalVols: number;
  avionsEnService: number;
  totalPersonnel: number;
  totalReservations: number;
  instancesDuJour: InstanceVol[];
}

// Formulaires de création/modification
export interface CreateRouteData {
  aeroport_depart: string;
  aeroport_arrive: string;
  distance_km?: number;
}

export interface CreateVolData {
  numero_vol: string;
  type_de_vol?: string;
  id_route: number;
}

export interface CreatePassagerData {
  nom: string;
  prenom: string;
  nationalite: string;
  date_naissance: string;
}

export interface CreateInstanceVolData {
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
}

export interface CreatePersonnelData {
  nom: string;
  prenom: string;
  sexe: string;
  date_naissance: string;
  date_debut_carriere: string;
  role: string;
  qualification_avion?: string;
}

export interface CreateReservationData {
  numero_siege: string;
  id_instance_vol: number;
  id_passager: number;
}
