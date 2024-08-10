import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/authentication/auth.service';
import { Firestore } from '@angular/fire/firestore';
import { AppComponent } from '../../../app.component';
import { InitUserService } from '../../../services/initUser/init-user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  authService = inject(AuthService);
  initUserService = inject(InitUserService);
  firestore: Firestore = inject(Firestore);
  fb = inject(FormBuilder);
  router = inject(Router);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
  visibilityIcon: string = 'assets/img/icons/visibility_off.png';
  inputType: string = 'password';
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  constructor(public appComponent: AppComponent) {}

  /**
   * Submits the login form and attempts to authenticate the user.
   * @returns {void}
   */
  onSubmit(): void {
    const rawForm = this.loginForm.getRawValue();
    this.appComponent.notificateUser('Anmelden');
    this.authService.login(rawForm.email, rawForm.password).subscribe({
      error: (err) => {
        console.log(err);
      },
    });
  }

  /**
   * Logs in as a guest user and initializes guest data.
   *
   * @returns {void}
   */
  loginAsGuest() {
    this.appComponent.notificateUser('Anmelden');
    this.authService.loginAsGuest().subscribe({
      next: () => {
        this.initUserService.setInitialDatabaseEntries('Max Mustermann');
        this.initUserService.setGuestExampleData();
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

  changePasswordVisibility() {
    if (this.inputType === 'password') {
      this.inputType = 'text';
      this.visibilityIcon = 'assets/img/icons/visibility.png';
    } else {
      this.inputType = 'password';
      this.visibilityIcon = 'assets/img/icons/visibility_off.png';
    }
  }

  /**
   * Logs in the user with Google authentication.
   * @returns {void}
   */
  loginWithGoogle(): void {
    this.appComponent.notificateUser('Anmelden');
    this.authService.signupWithGoogle().subscribe({
      next: () => {
        const creationAsUTC = this.authService.firebaseAuth.currentUser?.metadata.creationTime;
        const creationAsTimestamp = Number(this.convertToTimestamp(creationAsUTC!));
        if (Date.now() - creationAsTimestamp < 1000 * 10) {
          this.initUserService.setInitialDatabaseEntries();
        }
      },
    });
  }

  convertToTimestamp(dateString: string) {
    const date = new Date(dateString);
    const timestamp = date.getTime();
    const timestampString = timestamp.toString();
    return timestampString;
  }
}
