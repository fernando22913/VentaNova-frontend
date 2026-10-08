import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
  imports: [],
})
export class PaginationComponent {
  readonly page = input(1);
  readonly pageCount = input(1);
  readonly pageChange = output<number>();

  protected readonly pages = computed<Array<number | 'gap'>>(() => {
    const count = this.pageCount();
    const current = this.page();
    if (count <= 7) {
      return Array.from({ length: count }, (_, index) => index + 1);
    }

    const items: Array<number | 'gap'> = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(count - 1, current + 1);

    if (start > 2) items.push('gap');
    for (let page = start; page <= end; page += 1) items.push(page);
    if (end < count - 1) items.push('gap');
    items.push(count);

    return items;
  });

  protected goTo(page: number): void {
    if (page < 1 || page > this.pageCount() || page === this.page()) return;
    this.pageChange.emit(page);
  }
}
