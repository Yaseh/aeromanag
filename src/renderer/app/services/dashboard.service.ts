import { Injectable } from '@angular/core';
import { DashboardStats } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  async getStats(): Promise<DashboardStats> {
    return window.api.stats.dashboard();
  }
}
