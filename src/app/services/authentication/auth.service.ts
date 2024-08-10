import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  user,
  verifyBeforeUpdateEmail,
  verifyPasswordResetCode,
} from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { Router } from '@angular/router';
import { UserInterface } from './user.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  firebaseAuth = inject(Auth);
  user$ = user(this.firebaseAuth);
  currentUserSig = signal<UserInterface | null | undefined>(undefined);
  router = inject(Router);

  /**
   * Registers a new user with email, username, and password.
   *
   * @param {string} email - The user's email.
   * @param {string} username - The user's username.
   * @param {string} password - The user's password.
   * @returns {Observable<void>}
   */
  signup(email: string, username: string, password: string): Observable<void> {
    const promise = createUserWithEmailAndPassword(this.firebaseAuth, email, password).then((response) => {
      updateProfile(response.user, { displayName: username });
    });
    return from(promise);
  }

  /**
   * Signs up a user with Google.
   *
   * @returns {Observable<void>}
   */
  signupWithGoogle(): Observable<void> {
    const promise = signInWithPopup(this.firebaseAuth, new GoogleAuthProvider())
      .then(() => {})
      .catch((e) => {
        console.log(e);
      });
    return from(promise);
  }

  /**
   * Logs in a user with email and password.
   *
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   * @returns {Observable<void>}
   */
  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(this.firebaseAuth, email, password)
      .then(() => {})
      .catch((error) => {
        console.log(error);
      });
    return from(promise);
  }

  /**
   * Sets the user's avatar.
   *
   * @param {string} avatar - The URL of the avatar.
   * @returns {Observable<void>}
   */
  setAvatar(avatar: string): Observable<void> {
    const promise = updateProfile(this.firebaseAuth.currentUser!, {
      photoURL: avatar,
    })
      .then(() => {
        sendEmailVerification(this.firebaseAuth.currentUser!)
          .then(() => {})
          .catch((error) => {
            console.log(error);
          });
      })
      .catch((error) => {
        console.log(error);
      });
    return from(promise);
  }

  /**
   * Logs out the current user.
   *
   * @returns {Observable<void>}
   */
  logout(): Observable<void> {
    const promise = signOut(this.firebaseAuth);
    return from(promise);
  }

  /**
   * Sends a password reset link to the specified email.
   *
   * @param {string} email - The user's email.
   * @returns {Observable<void>}
   */
  sendPasswordResetLink(email: string): Observable<void> {
    const promise = sendPasswordResetEmail(this.firebaseAuth, email).catch((error) => {
      console.log(error);
    });
    return from(promise);
  }

  /**
   * Resets the user's password using the action code and new password.
   *
   * @param {string} actionCode - The action code from the password reset email.
   * @param {string} password - The new password.
   * @returns {Observable<void>}
   */
  resetPassword(actionCode: string, password: string): Observable<void> {
    const promise = verifyPasswordResetCode(this.firebaseAuth, actionCode).then(() => {
      confirmPasswordReset(this.firebaseAuth, actionCode, password).catch((e) => {
        console.log(e);
      });
    });
    return from(promise);
  }

  /**
   * Reauthenticates the user and sends an email to verify the new email adress.
   *
   * @param {string} newEmail - The new email address.
   * @returns {Observable<void>}
   */
  changeEmail(newEmail: string, password: string): Observable<void> {
    const promise = this.reauthPassword(password).then(() => {
      verifyBeforeUpdateEmail(this.firebaseAuth.currentUser!, newEmail).catch((error) => {
        console.log(error);
      });
    });
    return from(promise);
  }

  /**
   * Reauthenticates the current user using their email and password credentials.
   *
   * @param {string} password - The user's password.
   * @returns {Promise<void>} A promise that resolves when reauthentication completes.
   */
  async reauthPassword(password: string): Promise<void> {
    return reauthenticateWithCredential(
      this.firebaseAuth.currentUser!,
      EmailAuthProvider.credential(this.firebaseAuth.currentUser!.email!, password),
    )
      .then(() => {
        //  console.log('reautchenticated with credential');
      })
      .catch((error) => {
        console.log(error);
      });
  }

  /**
   * Logs in a guest user with predefined credentials.
   *
   * @returns {Observable<void>} An observable that resolves when the login operation is complete.
   */
  loginAsGuest(): Observable<void> {
    const promise = signInWithEmailAndPassword(this.firebaseAuth, 'MaxMustermann@gast.com', '123456')
      .then(() => {})
      .catch((error) => {
        console.log(error);
      });
    return from(promise);
  }

  /**
   * Searches for the google provider in the current user's list of providers and sets googleProviderExists true or false.
   * Users that are authenticated with google signup must not change their profile.
   *
   * @returns {Object}
   */
  searchProvider(): { googleProviderExists: boolean; userIsGuest: boolean } {
    const providers: string[] = [];
    this.firebaseAuth.currentUser!.providerData.forEach((provider) => {
      providers.push(provider.providerId);
    });
    return { googleProviderExists: providers.includes('google.com'), userIsGuest: providers.length === 0 };
  }
}
