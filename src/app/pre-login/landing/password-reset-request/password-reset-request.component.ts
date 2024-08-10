import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/authentication/auth.service';
import { Router, RouterLink } from '@angular/router';
import { AppComponent } from '../../../app.component';

@Component({
  selector: 'app-password-reset-request',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './password-reset-request.component.html',
  styleUrl: './password-reset-request.component.scss',
})
export class PasswordResetRequestComponent {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);

  pwResetForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(public appComponent: AppComponent) {}

  /**
   * Submits the password reset request form and sends a password reset link to the provided email.
   * @returns {void}
   */
  onSubmit(): void {
    const rawForm = this.pwResetForm.getRawValue();
    this.authService.sendPasswordResetLink(rawForm.email).subscribe({
      next: () => {
        this.appComponent.notificateUser('E-Mail gesendet');
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        console.log(err);
      },
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
}
