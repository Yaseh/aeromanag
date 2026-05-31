import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reservation } from '../../models';

@Component({
  selector: 'app-reservation-row',
  standalone: true,
  imports: [CommonModule],
  template: `
    <tr>
      <td>{{ reservation().id_reservation }}</td>
      <td>{{ reservation().passager?.prenom }} {{ reservation().passager?.nom }}</td>
      <td>{{ getRouteLabel() }}</td>
      <td>{{ reservation().instanceVol?.vol?.numero_vol ?? '—' }}</td>
      <td>{{ reservation().numero_siege }}</td>
      <td>{{ reservation().instanceVol?.heure_depart ?? '—' }}</td>
      <td>
        <button (click)="supprimer.emit(reservation())">Annuler</button>
      </td>
    </tr>
  `,
})
export class ReservationRowComponent {
  reservation = input.required<Reservation>();
  supprimer = output<Reservation>();

  getRouteLabel(): string {
    const dep = this.reservation().instanceVol?.vol?.route?.depart?.id_iata ?? '?';
    const arr = this.reservation().instanceVol?.vol?.route?.arrive?.id_iata ?? '?';
    return `${dep} → ${arr}`;
  }
}
