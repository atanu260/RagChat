import { Routes } from '@angular/router';

export const DOCUMENTS_ROUTES: Routes = [
  {
    path: ':id',
    title: 'Document details | RagChat',
    loadComponent: () => import('./document-detail.component').then((module) => module.DocumentDetailComponent),
  },
  {
    path: '',
    title: 'Documents | RagChat',
    loadComponent: () => import('./documents-page.component').then((module) => module.DocumentsPageComponent),
  },
];
