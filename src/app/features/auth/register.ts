import { Component, inject } from '@angular/core';
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

  protected name = '';
  protected email = '';
  protected password = '';
  protected confirmPassword = '';
  protected submitted = false;
  protected error: string | null = null;
  protected loading = false;

  protected onSubmit(): void {
    this.submitted = true;
    if (!this.name || !this.email || !this.password || this.password !== this.confirmPassword) {
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
