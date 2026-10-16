import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in | RagChat',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((module) => module.LoginComponent),
  },
  {
    path: 'register',
    title: 'Create account | RagChat',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register.component').then((module) => module.RegisterComponent),
  },
  {
    path: '',
    title: 'RagChat',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((module) => module.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'chat' },
      {
        path: 'chat',
        title: 'Chat | RagChat',
        loadChildren: () => import('./features/chat/chat.routes').then((module) => module.CHAT_ROUTES),
      },
      {
        path: 'documents',
        title: 'Documents | RagChat',
        loadChildren: () => import('./features/documents/documents.routes').then((module) => module.DOCUMENTS_ROUTES),
      },
    ],
  },
  {
    path: '**',
    title: 'Page not found | RagChat',
    loadComponent: () => import('./features/not-found/not-found-page.component').then((module) => module.NotFoundPageComponent),
  },
];
