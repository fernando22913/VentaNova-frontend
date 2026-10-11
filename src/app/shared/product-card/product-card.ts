import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MoneyPipe } from '../money.pipe';
import {
  PRODUCT_PLATFORM_LABELS,
  PRODUCT_TYPE_LABELS,
  type PublicProduct,
} from '../../core/models/catalog.model';

/**
 * Tarjeta reutilizable de producto. Recibe el recurso desde su componente
 * padre con `@Input()` y comunica la acción de añadir al carrito con
 * `@Output()`.
 */
@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.html',
  imports: [MoneyPipe, RouterLink],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: PublicProduct;
  @Output() addToCart = new EventEmitter<PublicProduct>();

  protected readonly platformLabels = PRODUCT_PLATFORM_LABELS;
  protected readonly typeLabels = PRODUCT_TYPE_LABELS;

  protected emitAddToCart(): void {
    this.addToCart.emit(this.product);
  }
}
