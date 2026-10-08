import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthStore } from '../../core/stores/auth.store';

@Component({
  selector: 'app-account',
  templateUrl: './account.html',
  imports: [DatePipe, RouterLink],
})
export class AccountComponent {
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly currentUser = this.store.currentUser;
  protected readonly isAdmin = this.store.isAdmin;

  protected readonly initials = computed(() => {
    const name = this.store.currentUser()?.name?.trim() ?? '';
    if (!name) return '?';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  });

  constructor() {
    this.store.refresh().subscribe({ error: () => this.store.logout() });
  }

  protected logout(): void {
    this.store.logout();
    void this.router.navigateByUrl('/');
  }
}
