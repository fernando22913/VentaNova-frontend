import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-category-filter',
  templateUrl: './category-filter.html',
  imports: [],
})
export class CategoryFilterComponent {
  readonly categories = input<Array<{ id: string; slug: string; name: string }>>([]);
  readonly selected = input('');
  readonly selectedChange = output<string>();

  protected select(slug: string): void {
    this.selectedChange.emit(slug);
  }
}
