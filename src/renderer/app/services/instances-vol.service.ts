import { Injectable } from '@angular/core';
import { CreateInstanceVolData, InstanceVol } from '../models';

@Injectable({ providedIn: 'root' })
export class InstancesVolService {
  async getAll(): Promise<InstanceVol[]> {
    return window.api.instances.getAll();
  }

  async create(data: CreateInstanceVolData): Promise<InstanceVol> {
    return window.api.instances.create(data);
  }

  async updateStatut(id: number, statut: string): Promise<InstanceVol> {
    return window.api.instances.update(id, { statut });
  }

  async update(id: number, data: Partial<CreateInstanceVolData & { statut: string }>): Promise<InstanceVol> {
    return window.api.instances.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await window.api.instances.delete(id);
  }
}
