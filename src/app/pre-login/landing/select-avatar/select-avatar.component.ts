import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../services/authentication/auth.service';
import { Router, RouterLink } from '@angular/router';
import { doc, Firestore, setDoc, updateDoc } from '@angular/fire/firestore';
import { from, map, of } from 'rxjs';
import { AppComponent } from '../../../app.component';
import { StorageService } from '../../../services/storage/storage.service';
import { ref, uploadBytes, uploadString } from '@angular/fire/storage';
import { getStorage } from '@firebase/storage';

export const forbiddenAvatarValidator = (control: AbstractControl): ValidationErrors | null => {
  const avatars = ['assets/img/logos/profile_logo.png'];
  return avatars.includes(control.value) ? { forbiddenAvatar: 'Bitte wählen Sie einen Avatar aus.' } : null;
};

@Component({
  selector: 'app-select-avatar',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterLink, FormsModule, NgFor, CommonModule],
  templateUrl: './select-avatar.component.html',
  styleUrl: './select-avatar.component.scss',
})
export class SelectAvatarComponent implements OnInit {
  authService: AuthService = inject(AuthService);
  firestore: Firestore = inject(Firestore);
  storageService: StorageService = inject(StorageService);
  fb = inject(FormBuilder);
  router = inject(Router);
  avatarForm = this.fb.nonNullable.group({
    avatar: ['assets/img/logos/profile_logo.png', [Validators.required, forbiddenAvatarValidator]],
  });
  avatarSig = signal(this.avatarForm.get('avatar')!.value);
  defaultAvatars = [
    'https://firebasestorage.googleapis.com/v0/b/da-bubble-b7d76.appspot.com/o/profilePictures%2Fcharacter_1.png?alt=media&token=78cc464e-e1aa-4b92-9c40-cdadf9ebd2ab',
    'https://firebasestorage.googleapis.com/v0/b/da-bubble-b7d76.appspot.com/o/profilePictures%2Fcharacter_2.png?alt=media&token=8d5e74ae-1d05-4745-8234-b41484173f2e',
    'https://firebasestorage.googleapis.com/v0/b/da-bubble-b7d76.appspot.com/o/profilePictures%2Fcharacter_3.png?alt=media&token=f0fd0c8a-990f-426f-a272-d5791929fe3d',
    'https://firebasestorage.googleapis.com/v0/b/da-bubble-b7d76.appspot.com/o/profilePictures%2Fcharacter_4.png?alt=media&token=e187e007-0c7a-43b8-9109-5959cf9e34c2',
    'https://firebasestorage.googleapis.com/v0/b/da-bubble-b7d76.appspot.com/o/profilePictures%2Fcharacter_5.png?alt=media&token=017af2c4-e467-4170-9aa6-2e4123f1d0b0',
    'https://firebasestorage.googleapis.com/v0/b/da-bubble-b7d76.appspot.com/o/profilePictures%2Fcharacter_6.png?alt=media&token=676b7ea4-44e0-423e-814e-ea973ef60389',
  ];
  submitButtonDisabled: boolean = false;

  constructor(public appComponent: AppComponent) {}

  /**
   * Initializes the component and subscribes to avatar form value changes.
   */
  ngOnInit(): void {
    this.avatarForm.get('avatar')!.valueChanges.subscribe((avatar) => {
      console.log(avatar);
      this.avatarSig.set(avatar);
    });
  }

  /**
   * Submits the avatar selection form and updates the user's avatar in the database.
   * @returns {void}
   */
  onSubmit(): void {
    const rawForm = this.avatarForm.getRawValue();
    this.authService.setAvatar(rawForm.avatar).subscribe({
      next: () => {
        this.appComponent.notificateUser('E-Mail gesendet');
        const userId = this.authService.firebaseAuth.currentUser!.uid;
        const userDoc = doc(this.firestore, 'users', userId);
        updateDoc(userDoc, { photoURL: rawForm.avatar });
        this.router.navigateByUrl('/').then(() => {
          location.reload();
        });
      },
      error: (err) => {
        console.log(err);
      },
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
              this.avatarForm.setValue({
                avatar: url,
              });
              this.submitButtonDisabled = false;
            },
          });
        },
      });
    }
  }
}
