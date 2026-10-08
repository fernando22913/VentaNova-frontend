import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthStore } from '../../core/stores/auth.store';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  imports: [FormsModule, RouterLink],
})
export class LoginComponent {
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly emailInput = viewChild<ElementRef<HTMLInputElement>>('emailInput');
  protected readonly passwordInput = viewChild<ElementRef<HTMLInputElement>>('passwordInput');

  protected email = '';
  protected password = '';
  protected submitted = false;
  protected error: string | null = null;
  protected loading = false;

  protected onSubmit(): void {
    this.submitted = true;
    if (!this.email) {
      this.emailInput()?.nativeElement.focus();
      return;
    }
    if (!this.password) {
      this.passwordInput()?.nativeElement.focus();
      return;
    }

    this.loading = true;
    this.error = null;
    this.store.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: () => {
        const next = this.route.snapshot.queryParamMap.get('next');
        void this.router.navigateByUrl(next ?? '/');
      },
      error: () => {
        this.error = 'Correo o contraseña incorrectos.';
        this.loading = false;
      },
    });
  }
}
