import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  imports: [RouterLink],
})
export class FooterComponent {
  protected readonly year = new Date().getFullYear();
}
