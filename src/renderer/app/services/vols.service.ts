import { Injectable } from '@angular/core';
import { CreateVolData, Vol } from '../models';

@Injectable({ providedIn: 'root' })
export class VolsService {
  async getAll(): Promise<Vol[]> {
    return window.api.vols.getAll();
  }

  async create(data: CreateVolData): Promise<Vol> {
    return window.api.vols.create(data);
  }

  async update(id: number, data: Partial<CreateVolData>): Promise<Vol> {
    return window.api.vols.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await window.api.vols.delete(id);
  }
}
