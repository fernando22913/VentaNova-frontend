import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MoneyPipe } from '../money.pipe';
import {
  PRODUCT_PLATFORM_LABELS,
  PRODUCT_TYPE_LABELS,
  type PublicProduct,
} from '../../core/models/catalog.model';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.html',
  imports: [MoneyPipe, RouterLink],
})
export class ProductCardComponent {
  readonly product = input.required<PublicProduct>();
  readonly addToCart = output<PublicProduct>();

  protected readonly platformLabels = PRODUCT_PLATFORM_LABELS;
  protected readonly typeLabels = PRODUCT_TYPE_LABELS;

  protected emitAddToCart(): void {
    this.addToCart.emit(this.product());
  }
}
