import { Pipe, type PipeTransform } from '@angular/core';

/**
 * Renders integer cents as a localized price, e.g. 3999 → "$39.99".
 * All money in the system is integer cents (backend invariant #5).
 */
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
