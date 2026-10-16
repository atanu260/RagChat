import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthPageComponent } from './auth-page.component';

@Component({
  selector: 'app-register',
  imports: [AuthPageComponent],
  template: '<app-auth-page mode="register" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {}
