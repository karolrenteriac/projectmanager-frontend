import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'projects/new',
    renderMode: RenderMode.Client
  },
  {
    path: 'projects/edit/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'projects/:projectId',
    renderMode: RenderMode.Client
  },
  {
    path: 'projects/:projectId/tasks',
    renderMode: RenderMode.Client
  },
  {
    path: 'tasks',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
