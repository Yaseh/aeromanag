import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AvionsService } from '../../services/avions.service';
import { Avion } from '../../models';

@Component({
  selector: 'app-avions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './avions.component.html',
  styleUrls: ['./avions.component.scss'],
})
export class AvionsComponent implements OnInit {
  private readonly avionsService = inject(AvionsService);
  private readonly fb = inject(FormBuilder);

  avions = signal<Avion[]>([]);
  loading = signal(true);
  erreur = signal<string | null>(null);
  afficherFormulaire = signal(false);
  modeEdition = signal<Avion | null>(null);

  // Dérivé : nombre d'avions en service
  nombreEnService = computed(() =>
    this.avions().filter(a => a.statut === 'En service').length
  );

  readonly statuts = ['En service', 'En maintenance', 'Hors service'];
  readonly modeles = ['Airbus A320', 'Airbus A380', 'Boeing 737', 'Boeing 777', 'Airbus A350', 'Boeing 787'];

  avionForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.chargerAvions();
  }

  private initForm(): void {
    this.avionForm = this.fb.group({
      model: ['', Validators.required],
      capacite: [null, [Validators.required, Validators.min(1), Validators.max(900)]],
      statut: ['En service', Validators.required],
      annee_mise_en_service: [''],
    });
  }

  async chargerAvions(): Promise<void> {
    this.loading.set(true);
    try {
      this.avions.set(await this.avionsService.getAll());
    } catch (err) {
      this.erreur.set('Impossible de charger les avions.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  ouvrirFormulaire(): void {
    this.modeEdition.set(null);
    this.avionForm.reset({ statut: 'En service' });
    this.afficherFormulaire.set(true);
  }

  ouvrirEdition(avion: Avion): void {
    this.modeEdition.set(avion);
    this.avionForm.patchValue({
      model: avion.model,
      capacite: avion.capacite,
      statut: avion.statut,
      annee_mise_en_service: avion.annee_mise_en_service
        ? new Date(avion.annee_mise_en_service).toISOString().split('T')[0]
        : '',
    });
    this.afficherFormulaire.set(true);
  }

  fermerFormulaire(): void {
    this.afficherFormulaire.set(false);
    this.modeEdition.set(null);
    this.erreur.set(null);
  }

  async soumettre(): Promise<void> {
    if (this.avionForm.invalid) return;
    this.erreur.set(null);

    const valeurs = this.avionForm.value as Omit<Avion, 'id_avion'>;

    try {
      const edition = this.modeEdition();
      if (edition) {
        const mis_a_jour = await this.avionsService.update(edition.id_avion, valeurs);
        this.avions.update(liste =>
          liste.map(a => a.id_avion === edition.id_avion ? mis_a_jour : a)
        );
      } else {
        const nouvel_avion = await this.avionsService.create(valeurs);
        this.avions.update(liste => [...liste, nouvel_avion]);
      }
      this.fermerFormulaire();
    } catch (err: unknown) {
      this.erreur.set(err instanceof Error ? err.message : 'Erreur inattendue.');
    }
  }

  async supprimer(avion: Avion): Promise<void> {
    if (!confirm(`Supprimer l'avion ${avion.model} ?`)) return;
    try {
      await this.avionsService.delete(avion.id_avion);
      this.avions.update(liste => liste.filter(a => a.id_avion !== avion.id_avion));
    } catch (err) {
      this.erreur.set('Impossible de supprimer cet avion (peut-être affecté à des vols).');
      console.error(err);
    }
  }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      'En service': 'badge-atterri',
      'En maintenance': 'badge-en-cours',
      'Hors service': 'badge-annule',
    };
    return map[statut] ?? 'badge-prevu';
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { year: 'numeric' });
  }
}
