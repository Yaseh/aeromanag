import { Injectable } from '@angular/core';
import { CreatePassagerData, Passager } from '../models';

@Injectable({ providedIn: 'root' })
export class PassagersService {
  async getAll(): Promise<Passager[]> {
    return window.api.passagers.getAll();
  }

  async create(data: CreatePassagerData): Promise<Passager> {
    return window.api.passagers.create(data);
  }

  async update(id: number, data: Partial<CreatePassagerData>): Promise<Passager> {
    return window.api.passagers.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await window.api.passagers.delete(id);
  }
}
