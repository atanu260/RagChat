import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    window.localStorage.removeItem('ragchat-access-token');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    window.localStorage.removeItem('ragchat-access-token');
  });

  it('stores a valid login token and exposes the authenticated user', () => {
    const token = createToken({
      sub: 'user-123',
      email: 'person@example.com',
      name: 'Rag Chat User',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    let displayName = '';

    service.login({ email: 'person@example.com', password: 'password' }).subscribe((user) => {
      displayName = user.displayName;
    });

    httpTesting.expectOne(`${environment.apiUrl}/api/auth/login`).flush({ accessToken: token });

    expect(window.localStorage.getItem('ragchat-access-token')).toBe(token);
    expect(displayName).toBe('Rag Chat User');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('clears the token and authentication state on logout', () => {
    const token = createToken({
      sub: 'user-123',
      email: 'person@example.com',
      name: 'Rag Chat User',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    service.login({ email: 'person@example.com', password: 'password' }).subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/api/auth/login`).flush({ accessToken: token });

    service.logout();

    expect(window.localStorage.getItem('ragchat-access-token')).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('starts unauthenticated when no token is stored', () => {
    expect(service.isAuthenticated()).toBe(false);
  });
});

function createToken(payload: object): string {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `header.${encodedPayload}.signature`;
}
