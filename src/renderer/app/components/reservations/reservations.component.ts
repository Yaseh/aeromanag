import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReservationsService } from '../../services/reservations.service';
import { InstancesVolService } from '../../services/instances-vol.service';
import { PassagersService } from '../../services/passagers.service';
import { Reservation, InstanceVol, Passager, CreateReservationData } from '../../models';
import { ReservationRowComponent } from './reservation-row.component';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ReservationRowComponent],
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.scss'],
})
export class ReservationsComponent implements OnInit {
  private readonly reservationsService = inject(ReservationsService);
  private readonly instancesService = inject(InstancesVolService);
  private readonly passagersService = inject(PassagersService);
  private readonly fb = inject(FormBuilder);

  reservations = signal<Reservation[]>([]);
  instances = signal<InstanceVol[]>([]);
  passagers = signal<Passager[]>([]);
  loading = signal(true);
  erreur = signal<string | null>(null);
  afficherFormulaire = signal(false);

  recherchePassager = signal<string>('');

  // Dérivé : réservations filtrées par nom de passager
  reservationsFiltrees = computed(() => {
    const terme = this.recherchePassager().toLowerCase();
    if (!terme) return this.reservations();
    return this.reservations().filter(r =>
      r.passager?.nom.toLowerCase().includes(terme) ||
      r.passager?.prenom.toLowerCase().includes(terme)
    );
  });

  // Nombre total de réservations filtrées
  totalFiltrees = computed(() => this.reservationsFiltrees().length);

  reservationForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.chargerDonnees();
  }

  private initForm(): void {
    this.reservationForm = this.fb.group({
      id_passager: [null, Validators.required],
      id_instance_vol: [null, Validators.required],
      numero_siege: ['', [Validators.required, Validators.pattern(/^[0-9]{1,3}[A-F]$/)]],
    });
  }

  async chargerDonnees(): Promise<void> {
    this.loading.set(true);
    try {
      const [reservations, instances, passagers] = await Promise.all([
        this.reservationsService.getAll(),
        this.instancesService.getAll(),
        this.passagersService.getAll(),
      ]);
      this.reservations.set(reservations);
      this.instances.set(instances);
      this.passagers.set(passagers);
    } catch (err) {
      this.erreur.set('Erreur lors du chargement des réservations.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  ouvrirFormulaire(): void {
    this.reservationForm.reset();
    this.erreur.set(null);
    this.afficherFormulaire.set(true);
  }

  fermerFormulaire(): void {
    this.afficherFormulaire.set(false);
    this.erreur.set(null);
  }

  async soumettre(): Promise<void> {
    if (this.reservationForm.invalid) return;
    this.erreur.set(null);

    const valeurs = this.reservationForm.value as CreateReservationData;

    try {
      const nouvelle = await this.reservationsService.create(valeurs);
      this.reservations.update(liste => [nouvelle, ...liste]);
      this.fermerFormulaire();
    } catch (err: unknown) {
      // Le handler IPC retourne un message clair pour P2002 (siège déjà pris)
      this.erreur.set(err instanceof Error ? err.message : 'Erreur inattendue.');
    }
  }

  async supprimer(reservation: Reservation): Promise<void> {
    if (!confirm(`Annuler la réservation siège ${reservation.numero_siege} ?`)) return;
    try {
      await this.reservationsService.delete(reservation.id_reservation);
      this.reservations.update(liste =>
        liste.filter(r => r.id_reservation !== reservation.id_reservation)
      );
    } catch (err) {
      this.erreur.set('Impossible de supprimer cette réservation.');
      console.error(err);
    }
  }

  setRecherchePassager(nom: string): void {
    this.recherchePassager.set(nom);
  }

  getRouteLabel(reservation: Reservation): string {
    const depart = reservation.instanceVol?.vol?.route?.depart?.id_iata ?? '?';
    const arrive = reservation.instanceVol?.vol?.route?.arrive?.id_iata ?? '?';
    return `${depart} → ${arrive}`;
  }

  getInstanceLabel(instance: InstanceVol): string {
    const num = instance.vol?.numero_vol ?? '?';
    const dep = instance.vol?.route?.depart?.id_iata ?? '?';
    const arr = instance.vol?.route?.arrive?.id_iata ?? '?';
    return `${num} — ${dep} → ${arr} (${instance.heure_depart})`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }
}
