import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ContactService } from '../../core/services/contact.service';
import { ProductosService } from '../../core/services/productos.service';
import type { ContactMessageResult } from '../../core/models/contact.model';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-contacto',
  templateUrl: './contacto.html',
  imports: [FormsModule],
})
export class ContactoComponent {
  private readonly contact = inject(ContactService);
  private readonly productosService = inject(ProductosService);

  /** Categorías de interés disponibles para la solicitud. */
  protected readonly intereses = this.productosService.getCategorias();

  protected readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  protected readonly emailInput = viewChild<ElementRef<HTMLInputElement>>('emailInput');
  protected readonly subjectInput = viewChild<ElementRef<HTMLInputElement>>('subjectInput');
  protected readonly messageInput = viewChild<ElementRef<HTMLTextAreaElement>>('messageInput');

  /** Two-way bound with `[(ngModel)]` in the template (template-driven form). */
  protected readonly form = {
    name: '',
    email: '',
    subject: '',
    interes: '',
    message: '',
  };

  // Signals for presentational state: the app runs zoneless, so writes from an
  // async subscription must be signal-backed (plain properties never schedule
  // a re-render after the request resolves).
  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sent = signal<ContactMessageResult | null>(null);

  protected readonly invalidEmail = computed(
    () => this.submitted() && (!this.form.email || !EMAIL_PATTERN.test(this.form.email.trim())),
  );

  /** Resumen en vivo derivado de los datos ingresados (requisito del formulario). */
  protected get resumenSolicitud(): string {
    const partes: string[] = [];
    if (this.form.interes) partes.push(`Interés: ${this.form.interes}`);
    if (this.form.name.trim()) partes.push(this.form.name.trim());
    if (this.form.email.trim()) partes.push(this.form.email.trim());
    return partes.join(' · ');
  }

  protected get caracteresMensaje(): number {
    return this.form.message.length;
  }

  protected onSubmit(): void {
    if (this.submitting() || this.sent()) return;
    this.submitted.set(true);
    this.error.set(null);

    if (!this.form.name.trim()) {
      this.nameInput()?.nativeElement.focus();
      return;
    }
    if (this.invalidEmail()) {
      this.emailInput()?.nativeElement.focus();
      return;
    }
    if (!this.form.subject.trim()) {
      this.subjectInput()?.nativeElement.focus();
      return;
    }
    if (!this.form.message.trim()) {
      this.messageInput()?.nativeElement.focus();
      return;
    }

    this.submitting.set(true);
    this.contact
      .sendMessage({
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        subject: this.form.subject.trim(),
        message: this.form.message.trim(),
      })
      .subscribe({
        next: (result) => {
          this.sent.set(result);
          this.submitting.set(false);
          this.resetForm();
        },
        error: () => {
          this.error.set('No se pudo registrar el mensaje. Inténtalo de nuevo en unos segundos.');
          this.submitting.set(false);
        },
      });
  }

  /** Clear the form only after the submission was actually persisted. */
  private resetForm(): void {
    this.form.name = '';
    this.form.email = '';
    this.form.subject = '';
    this.form.interes = '';
    this.form.message = '';
    this.submitted.set(false);
  }

  protected dismissSuccess(): void {
    this.sent.set(null);
  }
}