import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import type { PublicUser, UserRole } from '../../../core/models/auth.model';
import type { CreateUserInput } from '../../../core/models/admin.model';
import { USER_ROLE_LABELS } from '../../../core/models/admin.model';

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

function emptyForm(): UserForm {
  return { name: '', email: '', password: '', role: 'WORKER' };
}

/**
 * ADMIN-only: provision staff accounts (WORKER/ADMIN) and review every
 * account. The backend rejects non-admins with 403.
 */
@Component({
  selector: 'app-workers-manager',
  templateUrl: './workers-manager.html',
  imports: [DatePipe, FormsModule],
})
export class WorkersManagerComponent {
  private readonly admin = inject(AdminService);
  private readonly toasts = inject(ToastService);

  protected readonly users = signal<PublicUser[]>([]);
  protected readonly loading = signal(true);
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);

  protected readonly roleLabels = USER_ROLE_LABELS;
  protected readonly roles: readonly UserRole[] = ['WORKER', 'ADMIN', 'CUSTOMER'];

  protected form: UserForm = emptyForm();

  constructor() {
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.loading.set(true);
    this.admin.listUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.toasts.show('No se pudieron cargar las cuentas.', 'error');
        this.loading.set(false);
      },
    });
  }

  protected openCreate(): void {
    this.form = emptyForm();
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
  }

  protected save(): void {
    if (!this.form.name.trim() || !this.form.email.trim() || this.form.password.length < 8) {
      this.toasts.show('Revisa el nombre, el correo y una contraseña de 8+ caracteres', 'error');
      return;
    }

    const input: CreateUserInput = {
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      password: this.form.password,
      role: this.form.role,
    };

    this.saving.set(true);
    this.admin.createUser(input).subscribe({
      next: (user) => {
        this.saving.set(false);
        this.showForm.set(false);
        this.toasts.show(`Cuenta creada: ${user.email}`, 'success');
        this.loadUsers();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.toasts.show(messageFrom(error), 'error');
      },
    });
  }
}

function messageFrom(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { error?: { message?: string } } | null;
    return body?.error?.message ?? `Error ${error.status}`;
  }
  return 'Error inesperado';
}
