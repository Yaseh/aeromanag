import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InstancesVolService } from '../../services/instances-vol.service';
import { AvionsService } from '../../services/avions.service';
import { PersonnelService } from '../../services/personnel.service';
import { VolsService } from '../../services/vols.service';
import { InstanceVol, Avion, Personnel, Vol, StatutVol, CreateInstanceVolData } from '../../models';

@Component({
  selector: 'app-instances-vol',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './instances-vol.component.html',
  styleUrls: ['./instances-vol.component.scss'],
})
export class InstancesVolComponent implements OnInit {

  instances = signal<InstanceVol[]>([]);
  avions = signal<Avion[]>([]);
  allPersonnel = signal<Personnel[]>([]);
  vols = signal<Vol[]>([]);
  loading = signal(true);
  erreur = signal<string | null>(null);
  afficherFormulaire = signal(false);
  modeEdition = signal<InstanceVol | null>(null);

  // Filtres réactifs
  filtreStatut = signal<string>('');
  filtreDate = signal<string>('');

  // Données dérivées filtrées pour les dropdowns
  avionsEnService = computed(() =>
    this.avions().filter(a => a.statut === 'En service')
  );

  pilotes = computed(() =>
    this.allPersonnel().filter(p => p.role === 'Pilote')
  );

  copilotes = computed(() =>
    this.allPersonnel().filter(p => p.role === 'Copilote')
  );

  chefsCabine = computed(() =>
    this.allPersonnel().filter(p => p.role === 'Chef de cabine')
  );

  // Liste filtrée affichée dans le tableau
  instancesFiltrees = computed(() => {
    let liste = this.instances();
    if (this.filtreStatut()) {
      liste = liste.filter(i => i.statut === this.filtreStatut());
    }
    if (this.filtreDate()) {
      liste = liste.filter(i =>
        new Date(i.date_depart).toISOString().startsWith(this.filtreDate())
      );
    }
    return liste;
  });

  // Nombre total d'instances filtrées — visible dans le template
  totalFiltrees = computed(() => this.instancesFiltrees().length);

  // effect() : remet à zéro l'erreur quand le formulaire est ouvert
  private readonly _resetErreurEffect = effect(() => {
    if (this.afficherFormulaire()) {
      this.erreur.set(null);
    }
  });

  readonly statuts: StatutVol[] = ['Prévu', 'En cours', 'Atterri', 'Annulé'];

  planificationForm!: FormGroup;

  constructor(
    private instancesService: InstancesVolService,
    private avionsService: AvionsService,
    private personnelService: PersonnelService,
    private volsService: VolsService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.chargerDonnees();
  }

  private initForm(): void {
    this.planificationForm = this.fb.group({
      id_vol: [null, Validators.required],
      id_avion: [null, Validators.required],
      id_commandant: [null, Validators.required],
      id_copilote: [null, Validators.required],
      id_chef_cabine: [null, Validators.required],
      date_depart: ['', Validators.required],
      date_arrivee: ['', Validators.required],
      heure_depart: ['', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
      heure_arrivee: ['', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
      statut: ['Prévu', Validators.required],
    });
  }

  async chargerDonnees(): Promise<void> {
    this.loading.set(true);
    try {
      const [instances, avions, personnel, vols] = await Promise.all([
        this.instancesService.getAll(),
        this.avionsService.getAll(),
        this.personnelService.getAll(),
        this.volsService.getAll(),
      ]);
      this.instances.set(instances);
      this.avions.set(avions);
      this.allPersonnel.set(personnel);
      this.vols.set(vols);
    } catch (err) {
      this.erreur.set('Erreur lors du chargement des données.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  ouvrirFormulaire(): void {
    this.modeEdition.set(null);
    this.planificationForm.reset({ statut: 'Prévu' });
    this.afficherFormulaire.set(true);
  }

  ouvrirEdition(instance: InstanceVol): void {
    this.modeEdition.set(instance);
    this.planificationForm.patchValue({
      id_vol: instance.id_vol,
      id_avion: instance.id_avion,
      id_commandant: instance.id_commandant,
      id_copilote: instance.id_copilote,
      id_chef_cabine: instance.id_chef_cabine,
      date_depart: new Date(instance.date_depart).toISOString().split('T')[0],
      date_arrivee: new Date(instance.date_arrivee).toISOString().split('T')[0],
      heure_depart: instance.heure_depart,
      heure_arrivee: instance.heure_arrivee,
      statut: instance.statut,
    });
    this.afficherFormulaire.set(true);
  }

  fermerFormulaire(): void {
    this.afficherFormulaire.set(false);
    this.modeEdition.set(null);
    this.planificationForm.reset({ statut: 'Prévu' });
  }

  async soumettre(): Promise<void> {
    if (this.planificationForm.invalid) return;
    this.erreur.set(null);

    const valeurs = this.planificationForm.value as CreateInstanceVolData;

    try {
      const edition = this.modeEdition();
      if (edition) {
        const mise_a_jour = await this.instancesService.update(edition.id_instance_vol, valeurs);
        this.instances.update(liste =>
          liste.map(i => i.id_instance_vol === edition.id_instance_vol ? mise_a_jour : i)
        );
      } else {
        const nouvelle = await this.instancesService.create(valeurs);
        this.instances.update(liste => [nouvelle, ...liste]);
      }
      this.fermerFormulaire();
    } catch (err: unknown) {
      this.erreur.set(err instanceof Error ? err.message : 'Erreur inattendue.');
    }
  }

  async changerStatut(instance: InstanceVol, statut: StatutVol): Promise<void> {
    try {
      const mis_a_jour = await this.instancesService.updateStatut(instance.id_instance_vol, statut);
      this.instances.update(liste =>
        liste.map(i => i.id_instance_vol === instance.id_instance_vol ? mis_a_jour : i)
      );
    } catch (err) {
      this.erreur.set('Impossible de mettre à jour le statut.');
      console.error(err);
    }
  }

  async supprimer(instance: InstanceVol): Promise<void> {
    if (!confirm(`Supprimer le vol ${instance.vol?.numero_vol} ? Toutes les réservations associées seront également supprimées.`)) return;
    try {
      await this.instancesService.delete(instance.id_instance_vol);
      this.instances.update(liste =>
        liste.filter(i => i.id_instance_vol !== instance.id_instance_vol)
      );
    } catch (err) {
      this.erreur.set('Impossible de supprimer cette instance de vol.');
      console.error(err);
    }
  }

  setFiltreStatut(statut: string): void {
    this.filtreStatut.set(statut);
  }

  setFiltreDate(date: string): void {
    this.filtreDate.set(date);
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

  getRouteLabel(instance: InstanceVol): string {
    const depart = instance.vol?.route?.depart?.id_iata ?? '?';
    const arrive = instance.vol?.route?.arrive?.id_iata ?? '?';
    return `${depart} → ${arrive}`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }
}
