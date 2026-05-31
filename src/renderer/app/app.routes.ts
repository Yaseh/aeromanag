import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'aeroports',
    loadComponent: () =>
      import('./components/aeroports/aeroports.component').then(m => m.AeroportsComponent),
  },
  {
    path: 'routes',
    loadComponent: () =>
      import('./components/routes/routes.component').then(m => m.RoutesComponent),
  },
  {
    path: 'avions',
    loadComponent: () =>
      import('./components/avions/avions.component').then(m => m.AvionsComponent),
  },
  {
    path: 'personnel',
    loadComponent: () =>
      import('./components/personnel/personnel.component').then(m => m.PersonnelComponent),
  },
  {
    path: 'passagers',
    loadComponent: () =>
      import('./components/passagers/passagers.component').then(m => m.PassagersComponent),
  },
  {
    path: 'vols',
    loadComponent: () =>
      import('./components/vols/vols.component').then(m => m.VolsComponent),
  },
  {
    path: 'instances',
    loadComponent: () =>
      import('./components/instances-vol/instances-vol.component').then(m => m.InstancesVolComponent),
  },
  {
    path: 'reservations',
    loadComponent: () =>
      import('./components/reservations/reservations.component').then(m => m.ReservationsComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
