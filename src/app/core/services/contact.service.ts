import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ContactMessageInput, ContactMessageResult } from '../models/contact.model';

/**
 * Public contact form submission. The backend persists the message and
 * responds only after the row is committed — the service never fabricates a
 * "sent" confirmation.
 */
@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  sendMessage(input: ContactMessageInput): Observable<ContactMessageResult> {
    return this.http.post<ContactMessageResult>(`${this.baseUrl}/contact`, input);
  }
}