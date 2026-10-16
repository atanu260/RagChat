import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideFileUp, LucideLockKeyhole, LucideMessageCircle, LucideQuote } from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { getFriendlyErrorMessage } from '../../core/interceptors/error.interceptor';
import { ButtonComponent } from '../../shared/components/button/button.component';

type AuthMode = 'login' | 'register';
type AuthFormControls = {
  displayName: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
};

const passwordStrengthValidator = Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/);

@Component({
  selector: 'app-auth-page',
  imports: [ButtonComponent, LucideFileUp, LucideLockKeyhole, LucideMessageCircle, LucideQuote, ReactiveFormsModule, RouterLink],
  templateUrl: './auth-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly mode = input<AuthMode>('login');
  protected readonly pending = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly passwordVisible = signal(false);
  protected readonly confirmPasswordVisible = signal(false);
  protected readonly isRegister = computed(() => this.mode() === 'register');
  protected readonly form = new FormGroup<AuthFormControls>({
    displayName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(320)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72),
        passwordStrengthValidator,
      ],
    }),
    confirmPassword: new FormControl('', { nonNullable: true }),
  }, { validators: this.passwordsMatchValidator() });

  constructor() {
    effect(() => {
      const registration = this.isRegister();
      this.form.controls.displayName.setValidators(
        registration ? [Validators.required, Validators.maxLength(100)] : [],
      );
      this.form.controls.confirmPassword.setValidators(registration ? [Validators.required] : []);
      this.form.controls.displayName.updateValueAndValidity({ emitEvent: false });
      this.form.controls.confirmPassword.updateValueAndValidity({ emitEvent: false });
      this.form.updateValueAndValidity({ emitEvent: false });
    });

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.serverError.set(null));
  }

  protected submit(): void {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.serverError.set(null);
    this.pending.set(true);
    const { email, password, displayName } = this.form.getRawValue();
    const request = this.isRegister()
      ? this.auth.register({ email, password, displayName })
      : this.auth.login({ email, password });

    request.subscribe({
      next: () => {
        this.pending.set(false);
        void this.router.navigateByUrl('/chat');
      },
      error: (error: unknown) => {
        this.serverError.set(getFriendlyErrorMessage(error));
        this.pending.set(false);
      },
    });
  }

  private passwordsMatchValidator(): ValidatorFn {
    return (control): ValidationErrors | null => {
      if (!this.isRegister()) {
        return null;
      }

      const password = control.get('password')?.value as string | undefined;
      const confirmation = control.get('confirmPassword')?.value as string | undefined;
      return confirmation && password !== confirmation ? { passwordMismatch: true } : null;
    };
  }
}
