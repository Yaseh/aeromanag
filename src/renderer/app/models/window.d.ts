// Déclaration de window.api exposé par le preload via contextBridge
// Permet au TypeScript Angular de connaître les types sans importer Electron

interface Window {
  api: {
    stats: {
      dashboard: () => Promise<import('./index').DashboardStats>;
    };
    instances: {
      getAll: () => Promise<import('./index').InstanceVol[]>;
      create: (data: import('./index').CreateInstanceVolData) => Promise<import('./index').InstanceVol>;
      update: (id: number, data: Partial<import('./index').CreateInstanceVolData & { statut: string }>) => Promise<import('./index').InstanceVol>;
      delete: (id: number) => Promise<{ success: boolean }>;
    };
    personnel: {
      getAll: () => Promise<import('./index').Personnel[]>;
      create: (data: import('./index').CreatePersonnelData) => Promise<import('./index').Personnel>;
      update: (id: number, data: Partial<import('./index').CreatePersonnelData>) => Promise<import('./index').Personnel>;
      delete: (id: number) => Promise<{ success: boolean }>;
    };
    reservations: {
      getAll: () => Promise<import('./index').Reservation[]>;
      create: (data: import('./index').CreateReservationData) => Promise<import('./index').Reservation>;
      delete: (id: number) => Promise<{ success: boolean }>;
    };
    avions: {
      getAll: () => Promise<import('./index').Avion[]>;
      create: (data: Omit<import('./index').Avion, 'id_avion'>) => Promise<import('./index').Avion>;
      update: (id: number, data: Partial<Omit<import('./index').Avion, 'id_avion'>>) => Promise<import('./index').Avion>;
      delete: (id: number) => Promise<{ success: boolean }>;
    };
    aeroports: {
      getAll: () => Promise<import('./index').Aeroport[]>;
      create: (data: import('./index').Aeroport) => Promise<import('./index').Aeroport>;
      update: (id_iata: string, data: Partial<Omit<import('./index').Aeroport, 'id_iata'>>) => Promise<import('./index').Aeroport>;
      delete: (id_iata: string) => Promise<{ success: boolean }>;
    };
    routes: {
      getAll: () => Promise<import('./index').Route[]>;
      create: (data: import('./index').CreateRouteData) => Promise<import('./index').Route>;
      update: (id: number, data: Partial<import('./index').CreateRouteData>) => Promise<import('./index').Route>;
      delete: (id: number) => Promise<{ success: boolean }>;
    };
    vols: {
      getAll: () => Promise<import('./index').Vol[]>;
      create: (data: import('./index').CreateVolData) => Promise<import('./index').Vol>;
      update: (id: number, data: Partial<import('./index').CreateVolData>) => Promise<import('./index').Vol>;
      delete: (id: number) => Promise<{ success: boolean }>;
    };
    passagers: {
      getAll: () => Promise<import('./index').Passager[]>;
      create: (data: import('./index').CreatePassagerData) => Promise<import('./index').Passager>;
      update: (id: number, data: Partial<import('./index').CreatePassagerData>) => Promise<import('./index').Passager>;
      delete: (id: number) => Promise<{ success: boolean }>;
    };
  };
}
