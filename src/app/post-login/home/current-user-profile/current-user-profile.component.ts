import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FirebaseService } from '../../../services/firebase/firebase.service';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Firestore } from '@angular/fire/firestore';
import { AuthService } from '../../../services/authentication/auth.service';
import { ChatService } from '../../../services/chat/chat.service';
import { CommunicationService } from '../../../services/communication/communication.service';
import { AppComponent } from '../../../app.component';
import { StorageService } from '../../../services/storage/storage.service';
import { ref } from '@angular/fire/storage';
import { ThreadService } from '../../../services/thread/thread.service';
interface UserData {
  name: string;
  email: string;
}

@Component({
  selector: 'app-current-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './current-user-profile.component.html',
  styleUrl: './current-user-profile.component.scss',
})
export class CurrentUserProfileComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  firebaseService = inject(FirebaseService);
  authService = inject(AuthService);
  storageService = inject(StorageService);
  chatService = inject(ChatService);
  communicationService = inject(CommunicationService);
  threadService = inject(ThreadService);

  @Input() isCurrentUserProfileVisible: boolean = false;
  @Output() currentUserProfileVisibilityChange = new EventEmitter<boolean>();

  isEditProfileVisible: boolean = false;
  isEditAvatarVisible: boolean = false;

  newAvatarPath: string = '';
  newAvatarChosen: boolean = false;

  submitButtonDisabled: boolean = false;

  avatarList: Array<{ id: number; path: string }> = [
    {
      id: 0,
      path: 'https://firebasestorage.googleapis.com/v0/b/da-bubble-b7d76.appspot.com/o/profilePictures%2Fcharacter_1.png?alt=media&token=78cc464e-e1aa-4b92-9c40-cdadf9ebd2ab',
    },
    {
      id: 1,
      path: 'https://firebasestorage.googleapis.com/v0/b/da-bubble-b7d76.appspot.com/o/profilePictures%2Fcharacter_2.png?alt=media&token=8d5e74ae-1d05-4745-8234-b41484173f2e',
    },
    {
      id: 2,
      path: 'https://firebasestorage.googleapis.com/v0/b/da-bubble-b7d76.appspot.com/o/profilePictures%2Fcharacter_3.png?alt=media&token=f0fd0c8a-990f-426f-a272-d5791929fe3d',
    },
    {
      id: 3,
      path: 'https://firebasestorage.googleapis.com/v0/b/da-bubble-b7d76.appspot.com/o/profilePictures%2Fcharacter_4.png?alt=media&token=e187e007-0c7a-43b8-9109-5959cf9e34c2',
    },
    {
      id: 4,
      path: 'https://firebasestorage.googleapis.com/v0/b/da-bubble-b7d76.appspot.com/o/profilePictures%2Fcharacter_5.png?alt=media&token=017af2c4-e467-4170-9aa6-2e4123f1d0b0',
    },
    {
      id: 5,
      path: 'https://firebasestorage.googleapis.com/v0/b/da-bubble-b7d76.appspot.com/o/profilePictures%2Fcharacter_6.png?alt=media&token=676b7ea4-44e0-423e-814e-ea973ef60389',
    },
  ];

  newUserData: FormGroup;
  currentUserData: UserData;

  googleProviderExists: boolean = false;
  userIsGuest: boolean = false;

  constructor(
    private fb: FormBuilder,
    public appComponent: AppComponent,
  ) {
    this.currentUserData = {
      name: this.firebaseService.getUserDisplayName(this.firebaseService.currentUserId),
      email: this.firebaseService.getUserEmail(this.firebaseService.currentUserId),
    };
    this.newUserData = this.fb.group({
      name: [this.currentUserData.name, [Validators.required, this.fullNameValidator]],
      email: [this.currentUserData.email, [Validators.required, Validators.email]],
      password: [''],
    });
  }

  ngOnInit() {
    const provider = this.authService.searchProvider();
    this.googleProviderExists = provider.googleProviderExists;
    this.userIsGuest = provider.userIsGuest;
    this.newUserData.get('email')?.valueChanges.subscribe(() => {
      if (this.emailHasChanged(this.newUserData.controls['email']) && !this.googleProviderExists) {
        this.newUserData.controls['password'].addValidators([Validators.required, Validators.minLength(6)]);
        this.newUserData.controls['password'].updateValueAndValidity();
      } else {
        this.newUserData.controls['password'].clearValidators();
        this.newUserData.controls['password'].updateValueAndValidity();
      }
    });
  }

  /**
   * Custom validator to check if the input is a full name (two words).
   * @param {AbstractControl} control - The form control to validate.
   * @returns {ValidationErrors | null} An object with validation errors or null if the control is valid.
   */
  fullNameValidator(control: AbstractControl): ValidationErrors | null {
    const fullNamePattern = /^[a-zA-Z]+ [a-zA-Z]+$/;
    return fullNamePattern.test(control.value) ? null : { fullName: true };
  }

  emailHasChanged = (control: AbstractControl): string | null => {
    const initialEmailAuth = this.authService.firebaseAuth.currentUser!.email;
    const initialEmailDB = this.currentUserData.email;
    return (control.touched || control.dirty) && !((initialEmailAuth || initialEmailDB) === control.value)
      ? 'Bitte bestätigen Sie Ihr Passwort.'
      : null;
  };

  /**
   * Checks if the form control has a specific error.
   * @param {string} controlName - The name of the form control.
   * @param {string} errorName - The name of the error to check.
   * @returns {boolean} True if the error exists, false otherwise.
   */
  hasError(controlName: string, errorName: string): boolean {
    return this.newUserData.get(controlName)?.hasError(errorName) ?? false;
  }

  /**
   * Extracts the new user data from the form and initializes the change of the user's email adress.
   * Then updates the user's document in Firebase.
   * @returns {void}
   */
  saveProfile(): void {
    const updates: Partial<UserData> = this.newUserData.value;
    if (this.emailHasChanged(this.newUserData.controls['email']) && !this.googleProviderExists) {
      this.fullChange(updates);
    } else {
      this.changeInDatabaseOnly(updates);
    }
    this.communicationService.toggleCurrentUserProfileVisibility(true);
    this.toggleEditProfile();
  }

  fullChange(updates: Partial<UserData>): void {
    this.authService.changeEmail(this.newUserData.value.email, this.newUserData.value.password).subscribe({
      next: () => {
        this.appComponent.notificateUser('E-Mail gesendet');
        this.updateFirebaseData(updates).then(() => {
          this.logout();
        });
      },
    });
  }

  changeInDatabaseOnly(updates: Partial<UserData>) {
    this.appComponent.notificateUser('Änderungen gespeichert');
    this.updateFirebaseData(updates);
  }

  /**
   * Takes a partial user data object and updates the user's document in Firebase.
   * @param {Partial<UserData>} updates - An object containing the user data fields to be updated.
   * @returns {Promise<void>} A promise that resolves when the update operation completes.
   */
  async updateFirebaseData(updates: Partial<UserData>): Promise<void> {
    return this.firebaseService
      .updateUserProfile(updates)
      .then(() => {
        this.toggleCurrentUserProfile(false);
      })
      .catch((error) => {
        console.error('Error updating user profile: ', error);
      });
  }

  /**
   * Logs the user out and performs cleanup actions.
   * @returns {void}
   */
  logout(): void {
    // to-do OPTIONAL update user status to offline when close tab
    this.firebaseService.unsubscribeAllLists();
    this.chatService.unsubscribeAllLists();
    this.threadService.unsubscribeAllLists();
    this.firebaseService.updateUserStatus(false).then(() => {
      this.authService.logout().subscribe({
        next: () => {
          sessionStorage.clear();
        },
        error: (err) => {
          console.log(err);
        },
      });
    });
  }

  uploadFile(event: Event) {
    this.submitButtonDisabled = true;
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList) {
      let file: File | null = fileList[0];
      const storageRef = ref(
        this.storageService.storage,
        `profilePictures/${this.authService.firebaseAuth.currentUser!.uid}/${file.name}`,
      );
      this.storageService.uploadFile(storageRef, file).subscribe({
        next: (snapshot) => {
          this.storageService.getURL(snapshot.ref).subscribe({
            next: (url) => {
              this.setNewAvatar(url);
            },
          });
        },
      });
    }
  }

  /**
   * Sets a new avatar path based on the provided index from the avatar list.
   * @param {number} path - The index of the avatar in the avatar list.
   */
  setNewAvatar(identifier: number | string) {
    if (typeof identifier === 'number') {
      this.newAvatarPath = this.avatarList[identifier].path;
    } else {
      this.newAvatarPath = identifier;
    }
    this.newAvatarChosen = true;
  }

  /**
   * Updates the user's avatar if a new avatar has been chosen.
   * Calls the `updateUserAvatar` method from `firebaseService` to update the photoURL in Firestore users collection.
   * Toggles the edit avatar overlay upon successful avatar update.
   * Logs a warning message if an error occurs during the avatar update. to-do: handle error diffrently?!?
   */
  updateAvatar() {
    if (this.newAvatarChosen) {
      this.firebaseService
        .updateUserAvatar(this.newAvatarPath)
        .then(() => {
          this.toggleEditAvatar();
        })
        .catch((error: any) => {
          console.warn('Error updating user avatar: ', error);
        });
    }
  }

  /**
   * Handles cancel actions for different modals.
   * @param {string} name - The name of the modal to cancel ('editProfile' or 'editAvatar').
   * @returns {void}
   */
  onCancel(name: string): void {
    if (name === 'editProfile') {
      this.newUserData.reset(this.currentUserData);
      this.toggleEditProfile();
    } else if (name === 'editAvatar') {
      this.toggleEditAvatar();
      this.newAvatarChosen = false;
      this.newAvatarPath = '';
    }
  }

  /**
   * Toggles the visibility of the current user's profile.
   * @param {boolean} visible - Indicates whether to show or hide the current user's profile.
   * @returns {void}
   */
  toggleCurrentUserProfile(visible: boolean) {
    this.currentUserProfileVisibilityChange.emit(visible);
  }

  /**
   * Toggles the visibility of the edit profile interface.
   * @returns {void}
   */
  toggleEditProfile() {
    this.isEditProfileVisible = !this.isEditProfileVisible;
  }

  /**
   * Toggles the visibility of the avatar editing interface.
   * @returns {void}
   */
  toggleEditAvatar() {
    this.isEditAvatarVisible = !this.isEditAvatarVisible;
  }
}
