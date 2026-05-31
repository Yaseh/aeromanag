import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AeroportsService } from '../../services/aeroports.service';
import { Aeroport } from '../../models';

@Component({
  selector: 'app-aeroports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './aeroports.component.html',
  styleUrls: ['./aeroports.component.scss'],
})
export class AeroportsComponent implements OnInit {

  aeroports = signal<Aeroport[]>([]);
  loading = signal(true);
  erreur = signal<string | null>(null);
  afficherFormulaire = signal(false);
  modeEdition = signal<Aeroport | null>(null);

  rechercheVille = signal<string>('');

  // Dérivé : liste filtrée par ville ou pays
  aeroportsFiltres = computed(() => {
    const terme = this.rechercheVille().toLowerCase();
    if (!terme) return this.aeroports();
    return this.aeroports().filter(a =>
      a.ville.toLowerCase().includes(terme) ||
      a.pays.toLowerCase().includes(terme) ||
      a.id_iata.toLowerCase().includes(terme)
    );
  });

  readonly types = ['International', 'Régional', 'Cargo', 'Militaire'];

  aeroportForm!: FormGroup;

  constructor(private aeroportsService: AeroportsService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.chargerAeroports();
  }

  private initForm(): void {
    this.aeroportForm = this.fb.group({
      id_iata: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3), Validators.pattern(/^[A-Z]{3}$/)]],
      nom: ['', Validators.required],
      ville: ['', Validators.required],
      pays: ['', Validators.required],
      type: ['International', Validators.required],
    });
  }

  async chargerAeroports(): Promise<void> {
    this.loading.set(true);
    try {
      this.aeroports.set(await this.aeroportsService.getAll());
    } catch (err) {
      this.erreur.set('Impossible de charger les aéroports.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  ouvrirFormulaire(): void {
    this.modeEdition.set(null);
    this.aeroportForm.reset({ type: 'International' });
    this.aeroportForm.get('id_iata')?.enable();
    this.afficherFormulaire.set(true);
  }

  ouvrirEdition(aeroport: Aeroport): void {
    this.modeEdition.set(aeroport);
    this.aeroportForm.patchValue(aeroport);
    // L'IATA est la PK — non modifiable après création
    this.aeroportForm.get('id_iata')?.disable();
    this.afficherFormulaire.set(true);
  }

  fermerFormulaire(): void {
    this.afficherFormulaire.set(false);
    this.modeEdition.set(null);
    this.erreur.set(null);
    this.aeroportForm.get('id_iata')?.enable();
  }

  async soumettre(): Promise<void> {
    if (this.aeroportForm.invalid) return;
    this.erreur.set(null);

    // getRawValue() pour inclure les champs disabled (id_iata en mode édition)
    const valeurs = this.aeroportForm.getRawValue() as Aeroport;

    try {
      const edition = this.modeEdition();
      if (edition) {
        const { id_iata, ...reste } = valeurs;
        const mis_a_jour = await this.aeroportsService.update(edition.id_iata, reste);
        this.aeroports.update(liste =>
          liste.map(a => a.id_iata === edition.id_iata ? mis_a_jour : a)
        );
      } else {
        const nouvel = await this.aeroportsService.create(valeurs);
        this.aeroports.update(liste => [...liste, nouvel]);
      }
      this.fermerFormulaire();
    } catch (err: unknown) {
      this.erreur.set(err instanceof Error ? err.message : 'Erreur inattendue.');
    }
  }

  async supprimer(aeroport: Aeroport): Promise<void> {
    if (!confirm(`Supprimer l'aéroport ${aeroport.id_iata} — ${aeroport.nom} ?`)) return;
    try {
      await this.aeroportsService.delete(aeroport.id_iata);
      this.aeroports.update(liste => liste.filter(a => a.id_iata !== aeroport.id_iata));
    } catch (err) {
      this.erreur.set('Impossible de supprimer (aéroport utilisé dans des routes).');
      console.error(err);
    }
  }

  setRechercheVille(terme: string): void {
    this.rechercheVille.set(terme);
  }
}
