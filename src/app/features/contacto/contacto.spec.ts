import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { ContactService } from '../../core/services/contact.service';
import type { ContactMessageResult } from '../../core/models/contact.model';
import { ContactoComponent } from './contacto';

interface ContactSurface {
  form: { name: string; email: string; subject: string; interes: string; message: string };
  onSubmit(): void;
  submitting(): boolean;
  sent(): ContactMessageResult | null;
  readonly resumenSolicitud: string;
  readonly caracteresMensaje: number;
}

describe('ContactoComponent', () => {
  let fixture: ComponentFixture<ContactoComponent>;
  let view: ContactSurface;
  let sendMessage: ReturnType<typeof vi.fn>;

  const result: ContactMessageResult = {
    id: 'm-1',
    name: 'Ada Lovelace',
    subject: 'Licencias',
    message: '¿Son vitalicias?',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    sendMessage = vi.fn();
    await TestBed.configureTestingModule({
      imports: [ContactoComponent],
      providers: [{ provide: ContactService, useValue: { sendMessage } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactoComponent);
    view = fixture.componentInstance as unknown as ContactSurface;
    fixture.detectChanges();
  });

  function fillValid(): void {
    view.form.name = 'Ada Lovelace';
    view.form.email = 'ada@example.com';
    view.form.subject = 'Licencias';
    view.form.interes = 'Software';
    view.form.message = '¿Son vitalicias?';
  }

  it('binds an input field two-way with ngModel (typing updates the model)', () => {
    const email = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[name="email"]',
    )!;
    email.value = 'ada@example.com';
    email.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(view.form.email).toBe('ada@example.com');
  });

it('reflects model changes back into the bound input (ngModel write-back)', async () => {
    view.form.subject = 'Nuevo asunto';
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const subject = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[name="subject"]',
    )!;
    expect(subject.value).toBe('Nuevo asunto');
  });

  it('shows a live summary derived from the entered data', () => {
    view.form.name = 'Ada Lovelace';
    view.form.email = 'ada@example.com';
    view.form.interes = 'Software';
    view.form.message = 'Hola';
    fixture.detectChanges();

    expect(view.resumenSolicitud).toBe('Interés: Software · Ada Lovelace · ada@example.com');
    expect(view.caracteresMensaje).toBe(4);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Resumen de tu solicitud',
    );
  });

  it('shows field errors on an empty submit and never calls the API', () => {
    view.onSubmit();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Introduce tu nombre.');
    expect(el.textContent).toContain('Introduce tu correo.');
    expect(el.textContent).toContain('Introduce un asunto.');
    expect(el.textContent).toContain('Escribe un mensaje.');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('rejects an invalid email format before calling the API', () => {
    view.form.email = 'not-an-email';
    view.onSubmit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Introduce un correo válido.',
    );
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('posts the trimmed payload and resets the form only after success', () => {
    sendMessage.mockReturnValue(of(result));
    fillValid();
    view.onSubmit();
    fixture.detectChanges();

    expect(sendMessage).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Licencias',
      message: '¿Son vitalicias?',
    });
    expect(view.sent()).toEqual(result);
    expect(view.form).toEqual({ name: '', email: '', subject: '', interes: '', message: '' });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Mensaje enviado');
  });

  it('disables the submit button while a request is in flight', () => {
    const pending = new Subject<ContactMessageResult>();
    sendMessage.mockReturnValue(pending);
    fillValid();
    view.onSubmit();
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    )!;
    expect(view.submitting()).toBe(true);
    expect(button.disabled).toBe(true);
    expect(button.textContent?.trim()).toContain('Enviando');

    pending.next(result);
    pending.complete();
  });

  it('surfaces an error message when the request fails', () => {
    sendMessage.mockReturnValue(throwError(() => new Error('boom')));
    fillValid();
    view.onSubmit();
    fixture.detectChanges();

    expect(view.submitting()).toBe(false);
    expect(view.sent()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No se pudo registrar el mensaje.',
    );
  });
});