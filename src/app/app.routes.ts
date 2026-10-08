import { Routes } from '@angular/router';

import { adminGuard, authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'ByteMarket — Catálogo',
    loadComponent: () => import('./features/catalog/catalog').then((m) => m.CatalogComponent),
  },
  {
    path: 'catalog/:slug',
    title: 'ByteMarket — Producto',
    loadComponent: () =>
      import('./features/product-detail/product-detail').then((m) => m.ProductDetailComponent),
  },
  {
    path: 'cart',
    title: 'ByteMarket — Carrito',
    loadComponent: () => import('./features/cart/cart').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    title: 'ByteMarket — Finalizar compra',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout').then((m) => m.CheckoutComponent),
  },
  {
    path: 'orders',
    title: 'ByteMarket — Pedidos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/orders').then((m) => m.OrdersComponent),
  },
  {
    path: 'orders/:id',
    title: 'ByteMarket — Pedido',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/order-detail').then((m) => m.OrderDetailComponent),
  },
  {
    path: 'library',
    title: 'ByteMarket — Biblioteca',
    canActivate: [authGuard],
    loadComponent: () => import('./features/library/library').then((m) => m.LibraryComponent),
  },
  {
    path: 'login',
    title: 'ByteMarket — Iniciar sesión',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    title: 'ByteMarket — Crear cuenta',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'account',
    title: 'ByteMarket — Mi cuenta',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/account').then((m) => m.AccountComponent),
  },
  {
    path: 'admin',
    title: 'ByteMarket — Administración',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin').then((m) => m.AdminPanelComponent),
  },
  {
    path: '**',
    title: 'ByteMarket — No encontrado',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
