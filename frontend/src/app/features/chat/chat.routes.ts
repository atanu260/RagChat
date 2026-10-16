import { Routes } from '@angular/router';

export const CHAT_ROUTES: Routes = [
  {
    path: ':sessionId',
    title: 'Chat | RagChat',
    loadComponent: () => import('./chat-page.component').then((module) => module.ChatPageComponent),
  },
  {
    path: '',
    title: 'Chat | RagChat',
    loadComponent: () => import('./chat-page.component').then((module) => module.ChatPageComponent),
  },
];
