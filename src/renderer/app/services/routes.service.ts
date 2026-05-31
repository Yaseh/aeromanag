import { Injectable } from '@angular/core';
import { CreateRouteData, Route } from '../models';

@Injectable({ providedIn: 'root' })
export class RoutesService {
  async getAll(): Promise<Route[]> {
    return window.api.routes.getAll();
  }

  async create(data: CreateRouteData): Promise<Route> {
    return window.api.routes.create(data);
  }

  async update(id: number, data: Partial<CreateRouteData>): Promise<Route> {
    return window.api.routes.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await window.api.routes.delete(id);
  }
}
