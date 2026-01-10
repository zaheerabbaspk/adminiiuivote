import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';

export const routes: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage)
      },
      {
        path: 'elections',
        loadComponent: () => import('./pages/elections/election-list/election-list.page').then(m => m.ElectionListPage)
      },
      {
        path: 'elections/create',
        loadComponent: () => import('./pages/elections/election-create/election-create.page').then(m => m.ElectionCreatePage)
      },
      {
        path: 'candidates',
        loadComponent: () => import('./pages/candidates/candidate-management.page').then(m => m.CandidateManagementPage)
      },
      {
        path: 'voters',
        loadComponent: () => import('./pages/voters/voter-management.page').then(m => m.VoterManagementPage)
      },
      {
        path: 'voting-control',
        loadComponent: () => import('./pages/voting-control/voting-control.page').then(m => m.VotingControlPage)
      },
      {
        path: 'results',
        loadComponent: () => import('./pages/results/results.page').then(m => m.ResultsPage)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./pages/audit-log/audit-log.page').then(m => m.AuditLogPage)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full',
  },
];
