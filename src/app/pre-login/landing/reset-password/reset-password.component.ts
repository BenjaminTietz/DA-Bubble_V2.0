import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../services/authentication/auth.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppComponent } from '../../../app.component';

export let comparePasswords = (control: AbstractControl): ValidationErrors | null => {
  return control.get('password')?.value != control.get('confirmPassword')?.value
    ? { comparePasswords: '*Die Passwörter müssen übereinstimmen.' }
    : null;
};

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);

  pwResetForm = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: [''],
    },
    { validators: comparePasswords },
  );
  visibilityIcon: string = 'assets/img/icons/visibility_off.png';
  inputType: string = 'password';

  /**
   * Constructor to initialize the component with the route information.
   * @param {ActivatedRoute} route - The activated route to access query parameters.
   */
  constructor(
    private route: ActivatedRoute,
    public appComponent: AppComponent,
  ) {}

  /**
   * Submits the password reset form and resets the user's password using the provided action code.
   * @returns {void}
   */
  onSubmit(): void {
    const rawForm = this.pwResetForm.getRawValue();
    this.route.queryParams.subscribe((params) => {
      const actionCode = params['oobCode'];
      this.authService.resetPassword(actionCode, rawForm.password).subscribe({
        next: () => {
          this.appComponent.notificateUser('Passwort zurückgesetzt');
          this.router.navigateByUrl('/');
        },
        error: (err) => {
          console.log(err);
        },
      });
    });
  }

  /**
   * Checks if a form control is invalid and has been touched or is dirty.
   * @param {FormControl<string>} formControl - The form control to check.
   * @returns {boolean} True if the form control is invalid and touched or dirty, otherwise false.
   */
  formInvalid(formControl: FormControl<string>): boolean {
    return formControl.invalid && (formControl.touched || formControl.dirty);
  }

  changePasswordVisibility() {
    if (this.inputType === 'password') {
      this.inputType = 'text';
      this.visibilityIcon = 'assets/img/icons/visibility.png';
    } else {
      this.inputType = 'password';
      this.visibilityIcon = 'assets/img/icons/visibility_off.png';
    }
  }
}
