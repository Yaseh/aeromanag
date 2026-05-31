import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent, NavItem } from './components/shared/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <div class="app-shell">
      <app-navbar [navItems]="navItems" />
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell { display: flex; min-height: 100vh; }
    .main-content { flex: 1; overflow-y: auto; min-width: 0; }
  `],
})
export class AppComponent {
  // Transmis via input() au composant NavbarComponent
  navItems: NavItem[] = [
    { label: 'Tableau de bord', route: '/dashboard', icon: '📊' },
    { label: 'Aéroports', route: '/aeroports', icon: '🏢' },
    { label: 'Routes', route: '/routes', icon: '🗺️' },
    { label: 'Avions', route: '/avions', icon: '🛩️' },
    { label: 'Personnel', route: '/personnel', icon: '👤' },
    { label: 'Passagers', route: '/passagers', icon: '🧳' },
    { label: 'Vols', route: '/vols', icon: '✈️' },
    { label: 'Instances de vol', route: '/instances', icon: '📋' },
    { label: 'Réservations', route: '/reservations', icon: '🎫' },
  ];
}
