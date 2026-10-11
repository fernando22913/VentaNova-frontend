import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../../environments/environment';
import { ContactService } from './contact.service';
import type { ContactMessageInput, ContactMessageResult } from '../models/contact.model';

const contactUrl = `${environment.apiUrl}/contact`;

describe('ContactService', () => {
  let service: ContactService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ContactService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ContactService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts the message to POST /contact and returns the persisted confirmation', () => {
    const input: ContactMessageInput = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Consulta sobre licencias',
      message: '¿Las licencias son vitalicias?',
    };
    const result: ContactMessageResult = {
      id: 'msg-1',
      name: 'Ada Lovelace',
      subject: 'Consulta sobre licencias',
      message: '¿Las licencias son vitalicias?',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    let received: ContactMessageResult | undefined;
    service.sendMessage(input).subscribe((value) => (received = value));

    const request = http.expectOne((req) => req.url === contactUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush(result);
    expect(received).toEqual(result);
  });
});