import { HttpEvent } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DocumentDto } from '../models/document.models';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly api = inject(ApiService);

  list(): Observable<readonly DocumentDto[]> {
    return this.api.get<readonly DocumentDto[]>('/api/documents');
  }

  getById(id: string): Observable<DocumentDto> {
    return this.api.get<DocumentDto>(`/api/documents/${encodeURIComponent(id)}`);
  }

  upload(file: File): Observable<HttpEvent<DocumentDto>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.api.postEvents<DocumentDto>('/api/documents', formData);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/documents/${encodeURIComponent(id)}`);
  }

  reindex(id: string): Observable<void> {
    return this.api.post<void>(`/api/documents/${encodeURIComponent(id)}/reindex`, null);
  }
}
