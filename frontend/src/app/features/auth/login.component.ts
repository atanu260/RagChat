import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthPageComponent } from './auth-page.component';

@Component({
  selector: 'app-login',
  imports: [AuthPageComponent],
  template: '<app-auth-page mode="login" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {}
