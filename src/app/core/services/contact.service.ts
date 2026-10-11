import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import type { ContactMessageInput, ContactMessageResult, StaffContactMessage } from '../models/contact.model';

/**
 * Contact data access. `sendMessage` is the public submission; the inbox
 * methods (`list`/`reply`) are staff-only (ADMIN/WORKER) and enforced
 * server-side.
 */
@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  sendMessage(input: ContactMessageInput): Observable<ContactMessageResult> {
    return this.http.post<ContactMessageResult>(`${this.baseUrl}/contact`, input);
  }

  list(): Observable<StaffContactMessage[]> {
    return this.http
      .get<{ items: StaffContactMessage[] }>(`${this.baseUrl}/contacts`)
      .pipe(map((response) => response.items));
  }

  reply(id: string, reply: string): Observable<StaffContactMessage> {
    return this.http.post<StaffContactMessage>(`${this.baseUrl}/contacts/${id}/reply`, { reply });
  }
}
