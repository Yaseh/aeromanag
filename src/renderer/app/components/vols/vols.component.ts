import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VolsService } from '../../services/vols.service';
import { RoutesService } from '../../services/routes.service';
import { Vol, Route, CreateVolData } from '../../models';

@Component({
  selector: 'app-vols',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vols.component.html',
  styleUrls: ['./vols.component.scss'],
})
export class VolsComponent implements OnInit {
  private readonly volsService = inject(VolsService);
  private readonly routesService = inject(RoutesService);
  private readonly fb = inject(FormBuilder);

  vols = signal<Vol[]>([]);
  routes = signal<Route[]>([]);
  loading = signal(true);
  erreur = signal<string | null>(null);
  afficherFormulaire = signal(false);
  modeEdition = signal<Vol | null>(null);

  // Dérivé : nombre de vols long-courriers
  nbLongCourrier = computed(() =>
    this.vols().filter(v => v.type_de_vol === 'Long-courrier').length
  );

  volForm!: FormGroup;

  readonly typesVol = ['Long-courrier', 'Court-courrier', 'Moyen-courrier'];

  ngOnInit(): void {
    this.initForm();
    this.chargerDonnees();
  }

  private initForm(): void {
    this.volForm = this.fb.group({
      numero_vol: ['', Validators.required],
      type_de_vol: [''],
      id_route: [null, Validators.required],
    });
  }

  async chargerDonnees(): Promise<void> {
    this.loading.set(true);
    try {
      const [vols, routes] = await Promise.all([
        this.volsService.getAll(),
        this.routesService.getAll(),
      ]);
      this.vols.set(vols);
      this.routes.set(routes);
    } catch (err) {
      this.erreur.set('Impossible de charger les vols.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  ouvrirFormulaire(): void {
    this.modeEdition.set(null);
    this.volForm.reset();
    this.erreur.set(null);
    this.afficherFormulaire.set(true);
  }

  ouvrirEdition(vol: Vol): void {
    this.modeEdition.set(vol);
    this.volForm.patchValue({
      numero_vol: vol.numero_vol,
      type_de_vol: vol.type_de_vol ?? '',
      id_route: vol.id_route,
    });
    this.erreur.set(null);
    this.afficherFormulaire.set(true);
  }

  fermerFormulaire(): void {
    this.afficherFormulaire.set(false);
    this.modeEdition.set(null);
    this.erreur.set(null);
  }

  async soumettre(): Promise<void> {
    if (this.volForm.invalid) return;
    this.erreur.set(null);

    const valeurs = this.volForm.value as CreateVolData;

    try {
      const edition = this.modeEdition();
      if (edition) {
        const mis_a_jour = await this.volsService.update(edition.id_vol, valeurs);
        this.vols.update(liste =>
          liste.map(v => v.id_vol === edition.id_vol ? mis_a_jour : v)
        );
      } else {
        const nouveau = await this.volsService.create(valeurs);
        this.vols.update(liste => [...liste, nouveau]);
      }
      this.fermerFormulaire();
    } catch (err: unknown) {
      this.erreur.set(err instanceof Error ? err.message : 'Erreur inattendue.');
    }
  }

  async supprimer(vol: Vol): Promise<void> {
    if (!confirm(`Supprimer le vol ${vol.numero_vol} ?`)) return;
    try {
      await this.volsService.delete(vol.id_vol);
      this.vols.update(liste => liste.filter(v => v.id_vol !== vol.id_vol));
    } catch (err) {
      this.erreur.set('Impossible de supprimer ce vol (des instances existent peut-être).');
      console.error(err);
    }
  }

  getRouteLabel(vol: Vol): string {
    const dep = vol.route?.depart?.id_iata ?? vol.route?.aeroport_depart ?? '?';
    const arr = vol.route?.arrive?.id_iata ?? vol.route?.aeroport_arrive ?? '?';
    return `${dep} → ${arr}`;
  }
}
