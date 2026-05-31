import { Injectable } from '@angular/core';
import { Aeroport } from '../models';

@Injectable({ providedIn: 'root' })
export class AeroportsService {
  async getAll(): Promise<Aeroport[]> {
    return window.api.aeroports.getAll();
  }

  async create(data: Aeroport): Promise<Aeroport> {
    return window.api.aeroports.create(data);
  }

  async update(id_iata: string, data: Partial<Omit<Aeroport, 'id_iata'>>): Promise<Aeroport> {
    return window.api.aeroports.update(id_iata, data);
  }

  async delete(id_iata: string): Promise<void> {
    await window.api.aeroports.delete(id_iata);
  }
}
