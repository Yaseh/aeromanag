import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">✈ AéroManag</div>
      <ul class="nav-links">
        @for (item of navItems(); track item.route) {
          <li>
            <a [routerLink]="item.route" routerLinkActive="active" class="nav-link">
              {{ item.label }}
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
  styles: [`
    .navbar {
      width: 200px;
      min-height: 100vh;
      background: #1e293b;
      display: flex;
      flex-direction: column;
      padding: 1rem 0;
      flex-shrink: 0;
    }
    .navbar-brand {
      padding: 0 1rem 1rem;
      border-bottom: 1px solid #334155;
      margin-bottom: 0.5rem;
      color: white;
      font-weight: 700;
      font-size: 1.1rem;
    }
    .nav-links { list-style: none; padding: 0; margin: 0; }
    .nav-link {
      display: block;
      padding: 0.6rem 1rem;
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.875rem;
    }
    .nav-link:hover { background: #334155; color: white; }
    .nav-link.active { background: #2563eb; color: white; }
  `],
})
export class NavbarComponent {
  // input() signal — reçoit la liste des éléments de nav depuis le parent
  navItems = input<NavItem[]>([]);
}
