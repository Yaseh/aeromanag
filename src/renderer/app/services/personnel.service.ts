import { Injectable } from '@angular/core';
import { CreatePersonnelData, Personnel } from '../models';

@Injectable({ providedIn: 'root' })
export class PersonnelService {
  async getAll(): Promise<Personnel[]> {
    return window.api.personnel.getAll();
  }

  async create(data: CreatePersonnelData): Promise<Personnel> {
    return window.api.personnel.create(data);
  }

  async update(id: number, data: Partial<CreatePersonnelData>): Promise<Personnel> {
    return window.api.personnel.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await window.api.personnel.delete(id);
  }
}
