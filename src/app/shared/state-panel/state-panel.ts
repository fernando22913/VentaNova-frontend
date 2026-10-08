import { Component, input, output } from '@angular/core';

export type StatePanelVariant = 'empty' | 'error' | 'loading';

@Component({
  selector: 'app-state-panel',
  templateUrl: './state-panel.html',
  imports: [],
})
export class StatePanelComponent {
  readonly variant = input<StatePanelVariant>('empty');
  readonly title = input<string>();
  readonly message = input<string>();
  readonly actionLabel = input<string>();
  readonly action = output<void>();
}
