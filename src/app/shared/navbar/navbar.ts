import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthStore } from '../../core/stores/auth.store';
import { CartStore } from '../../core/stores/cart.store';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  imports: [RouterLink, RouterLinkActive],
  host: {
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class NavbarComponent {
  private readonly store = inject(AuthStore);
  private readonly cart = inject(CartStore);
  private readonly router = inject(Router);

  protected readonly isLoggedIn = this.store.isLoggedIn;
  protected readonly isAdmin = this.store.isAdmin;
  protected readonly currentUser = this.store.currentUser;
  protected readonly cartCount = this.cart.count;
  protected readonly menuOpen = signal(false);

  protected readonly initials = computed(() => {
    const name = this.store.currentUser()?.name?.trim() ?? '';
    if (!name) return '?';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  });

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected logout(): void {
    this.store.logout();
    this.closeMenu();
    void this.router.navigateByUrl('/');
  }
}
