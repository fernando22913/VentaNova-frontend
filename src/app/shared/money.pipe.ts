import { Pipe, type PipeTransform } from '@angular/core';

// Muestra centavos enteros como precio localizado, p. ej. 3999 → "$39.99"; todo el dinero son centavos enteros.
@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(cents: number | null | undefined, currency = 'USD'): string {
    if (cents === null || cents === undefined || Number.isNaN(cents)) {
      return '';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  }
}
