import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PassagersService } from '../../services/passagers.service';
import { Passager, CreatePassagerData } from '../../models';

@Component({
  selector: 'app-passagers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './passagers.component.html',
  styleUrls: ['./passagers.component.scss'],
})
export class PassagersComponent implements OnInit {

  passagers = signal<Passager[]>([]);
  loading = signal(true);
  erreur = signal<string | null>(null);
  afficherFormulaire = signal(false);
  modeEdition = signal<Passager | null>(null);

  recherche = signal<string>('');

  // Dérivé : passagers filtrés par nom/prénom
  passagersFiltres = computed(() => {
    const terme = this.recherche().toLowerCase().trim();
    if (!terme) return this.passagers();
    return this.passagers().filter(p =>
      p.nom.toLowerCase().includes(terme) || p.prenom.toLowerCase().includes(terme)
    );
  });

  totalPassagers = computed(() => this.passagers().length);

  passagerForm!: FormGroup;

  constructor(private passagersService: PassagersService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.chargerPassagers();
  }

  private initForm(): void {
    this.passagerForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      nationalite: ['', Validators.required],
      date_naissance: ['', Validators.required],
    });
  }

  async chargerPassagers(): Promise<void> {
    this.loading.set(true);
    try {
      this.passagers.set(await this.passagersService.getAll());
    } catch (err) {
      this.erreur.set('Impossible de charger les passagers.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  ouvrirFormulaire(): void {
    this.modeEdition.set(null);
    this.passagerForm.reset();
    this.erreur.set(null);
    this.afficherFormulaire.set(true);
  }

  ouvrirEdition(passager: Passager): void {
    this.modeEdition.set(passager);
    this.passagerForm.patchValue({
      nom: passager.nom,
      prenom: passager.prenom,
      nationalite: passager.nationalite,
      date_naissance: new Date(passager.date_naissance).toISOString().split('T')[0],
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
    if (this.passagerForm.invalid) return;
    this.erreur.set(null);

    const valeurs = this.passagerForm.value as CreatePassagerData;

    try {
      const edition = this.modeEdition();
      if (edition) {
        const mis_a_jour = await this.passagersService.update(edition.id_passager, valeurs);
        this.passagers.update(liste =>
          liste.map(p => p.id_passager === edition.id_passager ? mis_a_jour : p)
        );
      } else {
        const nouveau = await this.passagersService.create(valeurs);
        this.passagers.update(liste => [...liste, nouveau]);
      }
      this.fermerFormulaire();
    } catch (err: unknown) {
      this.erreur.set(err instanceof Error ? err.message : 'Erreur inattendue.');
    }
  }

  async supprimer(passager: Passager): Promise<void> {
    if (!confirm(`Supprimer ${passager.prenom} ${passager.nom} ?`)) return;
    try {
      await this.passagersService.delete(passager.id_passager);
      this.passagers.update(liste =>
        liste.filter(p => p.id_passager !== passager.id_passager)
      );
    } catch (err) {
      this.erreur.set('Impossible de supprimer ce passager (des réservations existent peut-être).');
      console.error(err);
    }
  }

  setRecherche(val: string): void {
    this.recherche.set(val);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }
}
