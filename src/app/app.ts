import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { FooterComponent } from './shared/footer/footer';
import { NavbarComponent } from './shared/navbar/navbar';
import { ToastHostComponent } from './shared/toast-host/toast-host';

@Component({
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastHostComponent],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {}
