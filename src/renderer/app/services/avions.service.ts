import { Injectable } from '@angular/core';
import { Avion } from '../models';

@Injectable({ providedIn: 'root' })
export class AvionsService {
  async getAll(): Promise<Avion[]> {
    return window.api.avions.getAll();
  }

  async create(data: Omit<Avion, 'id_avion'>): Promise<Avion> {
    return window.api.avions.create(data);
  }

  async update(id: number, data: Partial<Omit<Avion, 'id_avion'>>): Promise<Avion> {
    return window.api.avions.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await window.api.avions.delete(id);
  }
}
