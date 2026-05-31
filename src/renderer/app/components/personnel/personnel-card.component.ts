import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Personnel } from '../../models';

@Component({
  selector: 'app-personnel-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <tr>
      <td>{{ membre.nom }}</td>
      <td>{{ membre.prenom }}</td>
      <td>{{ membre.sexe }}</td>
      <td>{{ formatDate(membre.date_naissance) }}</td>
      <td>{{ formatDate(membre.date_debut_carriere) }}</td>
      <td>{{ membre.role }}</td>
      <td>{{ membre.qualification_avion ?? '—' }}</td>
      <td>
        <button (click)="editer.emit(membre)">Modifier</button>
        <button (click)="supprimer.emit(membre)">Supprimer</button>
      </td>
    </tr>
  `,
})
export class PersonnelCardComponent {
  @Input() membre!: Personnel;
  @Output() editer = new EventEmitter<Personnel>();
  @Output() supprimer = new EventEmitter<Personnel>();

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }
}