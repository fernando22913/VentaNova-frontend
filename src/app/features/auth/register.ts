import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthStore } from '../../core/stores/auth.store';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  imports: [FormsModule, RouterLink],
})
export class RegisterComponent {
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  protected readonly emailInput = viewChild<ElementRef<HTMLInputElement>>('emailInput');
  protected readonly passwordInput = viewChild<ElementRef<HTMLInputElement>>('passwordInput');
  protected readonly confirmInput = viewChild<ElementRef<HTMLInputElement>>('confirmInput');

  protected name = '';
  protected email = '';
  protected password = '';
  protected confirmPassword = '';
  protected submitted = false;
  protected error: string | null = null;
  protected loading = false;

  protected onSubmit(): void {
    this.submitted = true;
    if (!this.name) {
      this.nameInput()?.nativeElement.focus();
      return;
    }
    if (!this.email) {
      this.emailInput()?.nativeElement.focus();
      return;
    }
    if (!this.password || this.password.length < 8) {
      this.passwordInput()?.nativeElement.focus();
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.confirmInput()?.nativeElement.focus();
      return;
    }

    this.loading = true;
    this.error = null;
    this.store
      .register({ email: this.email.trim(), name: this.name.trim(), password: this.password })
      .subscribe({
        next: () => void this.router.navigateByUrl('/'),
        error: () => {
          this.error = 'No se pudo crear la cuenta. Revisa el correo e inténtalo de nuevo.';
          this.loading = false;
        },
      });
  }
}
