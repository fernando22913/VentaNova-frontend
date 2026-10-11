import { Routes } from '@angular/router';

import { adminGuard, authGuard, guestGuard, workerGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'VentaNova — Inicio',
    loadComponent: () => import('./features/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'catalog',
    title: 'VentaNova — Catálogo',
    loadComponent: () => import('./features/catalog/catalog').then((m) => m.CatalogComponent),
  },
  {
    path: 'catalog/:slug',
    title: 'VentaNova — Producto',
    loadComponent: () =>
      import('./features/product-detail/product-detail').then((m) => m.ProductDetailComponent),
  },
  {
    path: 'tendencias',
    title: 'VentaNova — Tendencias',
    loadComponent: () => import('./features/tendencias/tendencias').then((m) => m.TendenciasComponent),
  },
  {
    path: 'contacto',
    title: 'VentaNova — Contacto',
    loadComponent: () => import('./features/contacto/contacto').then((m) => m.ContactoComponent),
  },
  {
    path: 'cart',
    title: 'VentaNova — Carrito',
    loadComponent: () => import('./features/cart/cart').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    title: 'VentaNova — Finalizar compra',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout').then((m) => m.CheckoutComponent),
  },
  {
    path: 'orders',
    title: 'VentaNova — Pedidos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/orders').then((m) => m.OrdersComponent),
  },
  {
    path: 'orders/:id',
    title: 'VentaNova — Pedido',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/order-detail').then((m) => m.OrderDetailComponent),
  },
  {
    path: 'library',
    title: 'VentaNova — Biblioteca',
    canActivate: [authGuard],
    loadComponent: () => import('./features/library/library').then((m) => m.LibraryComponent),
  },
  {
    path: 'login',
    title: 'VentaNova — Iniciar sesión',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    title: 'VentaNova — Crear cuenta',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'account',
    title: 'VentaNova — Mi cuenta',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/account').then((m) => m.AccountComponent),
  },
  {
    path: 'admin',
    title: 'VentaNova — Administración',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin').then((m) => m.AdminPanelComponent),
  },
  {
    path: 'worker',
    title: 'VentaNova — Panel de soporte',
    canActivate: [workerGuard],
    loadComponent: () => import('./features/worker/worker').then((m) => m.WorkerPanelComponent),
  },
  {
    path: '**',
    title: 'VentaNova — No encontrado',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
