import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStats, InstanceVol, StatutVol } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  erreur = signal<string | null>(null);

  // Dérivé calculé : taux d'occupation moyen des vols du jour
  tauxOccupationMoyen = computed(() => {
    const s = this.stats();
    if (!s || s.instancesDuJour.length === 0) return 0;
    const total = s.instancesDuJour.reduce((acc, inst) => {
      const reservations = inst.reservations?.length ?? 0;
      const capacite = inst.avion?.capacite ?? 1;
      return acc + (reservations / capacite) * 100;
    }, 0);
    return Math.round(total / s.instancesDuJour.length);
  });

  // effect() : réagit chaque fois que stats change
  private readonly _logEffect = effect(() => {
    const s = this.stats();
    if (s) {
      console.log(`Dashboard mis à jour : ${s.totalVols} vols, ${s.instancesDuJour.length} aujourd'hui`);
    }
  });

  constructor(private dashboardService: DashboardService) {}

  async ngOnInit(): Promise<void> {
    await this.chargerStats();
  }

  async chargerStats(): Promise<void> {
    this.loading.set(true);
    this.erreur.set(null);
    try {
      const data = await this.dashboardService.getStats();
      this.stats.set(data);
    } catch (err) {
      this.erreur.set('Impossible de charger les statistiques.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  getBadgeClass(statut: StatutVol): string {
    const classes: Record<StatutVol, string> = {
      'Prévu': 'badge-prevu',
      'En cours': 'badge-en-cours',
      'Atterri': 'badge-atterri',
      'Annulé': 'badge-annule',
    };
    return classes[statut] ?? 'badge-prevu';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  getRouteLabel(instance: InstanceVol): string {
    const depart = instance.vol?.route?.depart?.id_iata ?? '?';
    const arrive = instance.vol?.route?.arrive?.id_iata ?? '?';
    return `${depart} → ${arrive}`;
  }
}