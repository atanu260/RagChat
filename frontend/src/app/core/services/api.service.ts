import { HttpClient, HttpEvent, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');

  get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(this.url(path), { params });
  }

  post<T>(path: string, body: unknown, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(this.url(path), body, { headers });
  }

  postEvents<T>(path: string, body: unknown): Observable<HttpEvent<T>> {
    return this.http.post<T>(this.url(path), body, {
      observe: 'events',
      reportProgress: true,
    });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }

  private url(path: string): string {
    return `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
  }
}
