import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PersonnelService } from '../../services/personnel.service';
import { Personnel, CreatePersonnelData } from '../../models';
import { PersonnelCardComponent } from './personnel-card.component';

@Component({
  selector: 'app-personnel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PersonnelCardComponent],
  templateUrl: './personnel.component.html',
  styleUrls: ['./personnel.component.scss'],
})
export class PersonnelComponent implements OnInit {

  personnel = signal<Personnel[]>([]);
  loading = signal(true);
  erreur = signal<string | null>(null);
  afficherFormulaire = signal(false);
  modeEdition = signal<Personnel | null>(null);

  filtreRole = signal<string>('');
  rechercheNom = signal<string>('');

  readonly roles = ['Pilote', 'Copilote', 'Chef de cabine', 'Hôtesse', 'Steward', 'Mécanicien'];
  readonly modelsAvion = ['Airbus A320', 'Airbus A380', 'Boeing 737', 'Boeing 777'];

  // Dérivé : liste filtrée par rôle et recherche
  personnelFiltree = computed(() => {
    let liste = this.personnel();
    if (this.filtreRole()) {
      liste = liste.filter(p => p.role === this.filtreRole());
    }
    if (this.rechercheNom().trim()) {
      const terme = this.rechercheNom().toLowerCase();
      liste = liste.filter(p =>
        p.nom.toLowerCase().includes(terme) || p.prenom.toLowerCase().includes(terme)
      );
    }
    return liste;
  });

  // Décompte par rôle pour l'affichage des badges de statistiques
  nombreParRole = computed(() => {
    const compteur: Record<string, number> = {};
    for (const p of this.personnel()) {
      compteur[p.role] = (compteur[p.role] ?? 0) + 1;
    }
    return compteur;
  });

  personnelForm!: FormGroup;

  constructor(private personnelService: PersonnelService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.chargerPersonnel();
  }

  private initForm(): void {
    this.personnelForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      sexe: ['M', Validators.required],
      date_naissance: ['', Validators.required],
      date_debut_carriere: ['', Validators.required],
      role: ['', Validators.required],
      qualification_avion: [''],
    });
  }

  async chargerPersonnel(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.personnelService.getAll();
      this.personnel.set(data);
    } catch (err) {
      this.erreur.set('Impossible de charger le personnel.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  ouvrirFormulaire(): void {
    this.modeEdition.set(null);
    this.personnelForm.reset({ sexe: 'M' });
    this.afficherFormulaire.set(true);
  }

  ouvrirEdition(membre: Personnel): void {
    this.modeEdition.set(membre);
    this.personnelForm.patchValue({
      nom: membre.nom,
      prenom: membre.prenom,
      sexe: membre.sexe,
      date_naissance: new Date(membre.date_naissance).toISOString().split('T')[0],
      date_debut_carriere: new Date(membre.date_debut_carriere).toISOString().split('T')[0],
      role: membre.role,
      qualification_avion: membre.qualification_avion ?? '',
    });
    this.afficherFormulaire.set(true);
  }

  fermerFormulaire(): void {
    this.afficherFormulaire.set(false);
    this.modeEdition.set(null);
    this.erreur.set(null);
  }

  async soumettre(): Promise<void> {
    if (this.personnelForm.invalid) return;
    this.erreur.set(null);

    const valeurs = this.personnelForm.value as CreatePersonnelData;
    // Qualification avion vide → null
    if (!valeurs.qualification_avion) {
      valeurs.qualification_avion = undefined;
    }

    try {
      const edition = this.modeEdition();
      if (edition) {
        const mis_a_jour = await this.personnelService.update(edition.id_personnel, valeurs);
        this.personnel.update(liste =>
          liste.map(p => p.id_personnel === edition.id_personnel ? mis_a_jour : p)
        );
      } else {
        const nouveau = await this.personnelService.create(valeurs);
        this.personnel.update(liste => [...liste, nouveau]);
      }
      this.fermerFormulaire();
    } catch (err: unknown) {
      this.erreur.set(err instanceof Error ? err.message : 'Erreur inattendue.');
    }
  }

  async supprimer(membre: Personnel): Promise<void> {
    if (!confirm(`Supprimer ${membre.prenom} ${membre.nom} ?`)) return;
    try {
      await this.personnelService.delete(membre.id_personnel);
      this.personnel.update(liste =>
        liste.filter(p => p.id_personnel !== membre.id_personnel)
      );
    } catch (err) {
      this.erreur.set('Impossible de supprimer ce membre (peut-être affecté à des vols).');
      console.error(err);
    }
  }

  setFiltreRole(role: string): void {
    this.filtreRole.set(role);
  }

  setRechercheNom(nom: string): void {
    this.rechercheNom.set(nom);
  }

  getBadgeRoleClass(role: string): string {
    const map: Record<string, string> = {
      'Pilote': 'role-pilote',
      'Copilote': 'role-copilote',
      'Chef de cabine': 'role-chef',
      'Hôtesse': 'role-hotesse',
      'Steward': 'role-steward',
      'Mécanicien': 'role-meca',
    };
    return map[role] ?? 'role-autre';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }
}
