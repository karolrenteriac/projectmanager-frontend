import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'dashboard/notifications', loadComponent: () => import('./features/dashboard/components/notifications-panel/notifications-panel.component').then(m => m.NotificationsPanelComponent) },
      { path: 'projects', loadComponent: () => import('./features/projects/projects.component').then(m => m.ProjectsComponent) },
      { path: 'projects/new', loadComponent: () => import('./features/projects/create-project/create-project.component').then(m => m.CreateProjectComponent) },
      { path: 'projects/edit/:id', loadComponent: () => import('./features/projects/create-project/create-project.component').then(m => m.CreateProjectComponent) },
      { path: 'projects/:projectId', loadComponent: () => import('./features/project-overview/project-overview.component').then(m => m.ProjectOverviewComponent) },
      { path: 'invitations', loadComponent: () => import('./features/invitations/invitations.component').then(m => m.InvitationsComponent) },

      { path: 'projects/:projectId/tasks', loadComponent: () => import('./features/tasks-workspace/tasks-workspace.component').then(m => m.TasksWorkspaceComponent) },
      { path: 'tasks', loadComponent: () => import('./features/tasks/tasks.component').then(m => m.TasksComponent) },
      { path: 'calendar', loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent) },
      { path: 'documents', loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent) },
      { path: 'chat', loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent) },
      { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'settings', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      {
        path: 'admin/users',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/users/admin-users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'admin/project-governance',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/governance/admin-governance.component').then(m => m.AdminGovernanceComponent)
      },
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
