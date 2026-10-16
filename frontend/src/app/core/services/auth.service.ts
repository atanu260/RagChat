import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  AuthTokenResponse,
  AuthUser,
  JwtPayload,
  LoginRequest,
  RegisterRequest,
} from '../models/auth.models';

const TOKEN_STORAGE_KEY = 'ragchat-access-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly document = inject(DOCUMENT);
  private readonly tokenState = signal(this.readStoredToken());
  private readonly userState = signal(this.userFromToken(this.tokenState()));

  readonly token = this.tokenState.asReadonly();
  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.token() !== null && this.user() !== null);

  register(request: RegisterRequest): Observable<AuthUser> {
    return this.api.post<AuthTokenResponse>('/api/auth/register', request).pipe(
      map((response) => response.accessToken),
      tap((token) => this.setToken(token)),
      map(() => {
        const user = this.user();
        if (!user) {
          throw new Error('The registration response did not contain a valid access token.');
        }
        return user;
      }),
    );
  }

  login(request: LoginRequest): Observable<AuthUser> {
    return this.api.post<AuthTokenResponse>('/api/auth/login', request).pipe(
      map((response) => response.accessToken),
      tap((token) => this.setToken(token)),
      map(() => {
        const user = this.user();
        if (!user) {
          throw new Error('The login response did not contain a valid access token.');
        }
        return user;
      }),
    );
  }

  logout(): void {
    this.document.defaultView?.localStorage.removeItem(TOKEN_STORAGE_KEY);
    this.tokenState.set(null);
    this.userState.set(null);
  }

  private setToken(token: string): void {
    const user = this.userFromToken(token);
    if (!user) {
      throw new Error('The authentication response contained an invalid or expired access token.');
    }

    this.document.defaultView?.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    this.tokenState.set(token);
    this.userState.set(user);
  }

  private readStoredToken(): string | null {
    const token = this.document.defaultView?.localStorage.getItem(TOKEN_STORAGE_KEY) ?? null;
    if (!token || this.userFromToken(token)) {
      return token;
    }

    this.document.defaultView?.localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }

  private userFromToken(token: string | null): AuthUser | null {
    if (!token) {
      return null;
    }

    const [, encodedPayload] = token.split('.');
    if (!encodedPayload) {
      return null;
    }

    let payload: unknown;
    try {
      const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const decoded = this.document.defaultView?.atob(paddedBase64);
      if (!decoded) {
        return null;
      }
      const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
      payload = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof DOMException) {
        return null;
      }
      throw error;
    }

    if (!this.isJwtPayload(payload)) {
      return null;
    }

    const displayName = payload.name?.trim();
    const email = payload.email?.trim();
    if (!payload.sub || !displayName || !email || (payload.exp !== undefined && payload.exp <= Date.now() / 1000)) {
      return null;
    }

    return { id: payload.sub, email, displayName };
  }

  private isJwtPayload(value: unknown): value is JwtPayload {
    return typeof value === 'object' && value !== null
      && (!('sub' in value) || typeof value.sub === 'string')
      && (!('email' in value) || typeof value.email === 'string')
      && (!('name' in value) || typeof value.name === 'string')
      && (!('exp' in value) || typeof value.exp === 'number');
  }
}
