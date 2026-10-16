import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-avatar',
  template: `
    <span
      class="avatar"
      [class.avatar--sm]="size() === 'sm'"
      [class.avatar--md]="size() === 'md'"
      [class.avatar--lg]="size() === 'lg'"
      [attr.aria-label]="ariaLabel() || 'Avatar: ' + initials()"
      role="img"
    >
      {{ initials() }}
    </span>
  `,
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  readonly initials = input.required<string>();
  readonly size = input<AvatarSize>('md');
  readonly ariaLabel = input('');
}
