import { Injectable } from '@angular/core';
import { CreateReservationData, Reservation } from '../models';

@Injectable({ providedIn: 'root' })
export class ReservationsService {
  async getAll(): Promise<Reservation[]> {
    return window.api.reservations.getAll();
  }

  async create(data: CreateReservationData): Promise<Reservation> {
    return window.api.reservations.create(data);
  }

  async delete(id: number): Promise<void> {
    await window.api.reservations.delete(id);
  }
}
