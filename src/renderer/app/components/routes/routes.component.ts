import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoutesService } from '../../services/routes.service';
import { AeroportsService } from '../../services/aeroports.service';
import { Route, Aeroport, CreateRouteData } from '../../models';

@Component({
  selector: 'app-routes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './routes.component.html',
  styleUrls: ['./routes.component.scss'],
})
export class RoutesComponent implements OnInit {

  routes = signal<Route[]>([]);
  aeroports = signal<Aeroport[]>([]);
  loading = signal(true);
  erreur = signal<string | null>(null);
  afficherFormulaire = signal(false);
  modeEdition = signal<Route | null>(null);

  // Dérivé : nombre total de routes
  totalRoutes = computed(() => this.routes().length);

  routeForm!: FormGroup;

  constructor(
    private routesService: RoutesService,
    private aeroportsService: AeroportsService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.chargerDonnees();
  }

  private initForm(): void {
    this.routeForm = this.fb.group({
      aeroport_depart: ['', Validators.required],
      aeroport_arrive: ['', Validators.required],
      distance_km: [null],
    });
  }

  async chargerDonnees(): Promise<void> {
    this.loading.set(true);
    try {
      const [routes, aeroports] = await Promise.all([
        this.routesService.getAll(),
        this.aeroportsService.getAll(),
      ]);
      this.routes.set(routes);
      this.aeroports.set(aeroports);
    } catch (err) {
      this.erreur.set('Impossible de charger les routes.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  ouvrirFormulaire(): void {
    this.modeEdition.set(null);
    this.routeForm.reset();
    this.erreur.set(null);
    this.afficherFormulaire.set(true);
  }

  ouvrirEdition(route: Route): void {
    this.modeEdition.set(route);
    this.routeForm.patchValue({
      aeroport_depart: route.aeroport_depart,
      aeroport_arrive: route.aeroport_arrive,
      distance_km: route.distance_km,
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
    if (this.routeForm.invalid) return;
    this.erreur.set(null);

    const valeurs = this.routeForm.value as CreateRouteData;

    try {
      const edition = this.modeEdition();
      if (edition) {
        const mis_a_jour = await this.routesService.update(edition.id_route, valeurs);
        this.routes.update(liste =>
          liste.map(r => r.id_route === edition.id_route ? mis_a_jour : r)
        );
      } else {
        const nouvelle = await this.routesService.create(valeurs);
        this.routes.update(liste => [...liste, nouvelle]);
      }
      this.fermerFormulaire();
    } catch (err: unknown) {
      this.erreur.set(err instanceof Error ? err.message : 'Erreur inattendue.');
    }
  }

  async supprimer(route: Route): Promise<void> {
    const label = `${route.depart?.id_iata ?? route.aeroport_depart} → ${route.arrive?.id_iata ?? route.aeroport_arrive}`;
    if (!confirm(`Supprimer la route ${label} ?`)) return;
    try {
      await this.routesService.delete(route.id_route);
      this.routes.update(liste => liste.filter(r => r.id_route !== route.id_route));
    } catch (err) {
      this.erreur.set('Impossible de supprimer cette route (des vols y sont peut-être liés).');
      console.error(err);
    }
  }
}
