import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SkeletonVariant = 'line' | 'circle' | 'block';

@Component({
  selector: 'app-skeleton',
  template: `
    <span
      class="skeleton"
      [class.skeleton--line]="variant() === 'line'"
      [class.skeleton--circle]="variant() === 'circle'"
      [class.skeleton--block]="variant() === 'block'"
      [style.width]="variant() === 'circle' ? height() : width()"
      [style.height]="height()"
      aria-hidden="true"
    ></span>
  `,
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly variant = input<SkeletonVariant>('line');
  readonly width = input('100%');
  readonly height = input('1rem');
}
