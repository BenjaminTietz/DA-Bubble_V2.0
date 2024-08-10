import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FirebaseService } from '../../../services/firebase/firebase.service';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../../services/chat/chat.service';
import { CommunicationService } from '../../../services/communication/communication.service';
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent {
  firebaseService = inject(FirebaseService);
  chatService = inject(ChatService);
  communicationService = inject(CommunicationService);

  @Input() isUserProfileVisible: boolean = false;
  @Output() userProfileVisibilityChange = new EventEmitter<boolean>();

  showDataOfUser = this.communicationService.userProfileId;
  /**
   * Closes the user profile by emitting an event to change its visibility.
   * @returns {void}
   */
  closeUserProfile(): void {
    this.userProfileVisibilityChange.emit(false);
  }
  /**
   * Initiates a new private chat between the current user and the selected user profile.
   * Hides the user profile after initiating the chat.
   * @returns {void}
   */
  startNewPrivateChat() {
    this.chatService.initializePrivateChat(this.firebaseService.currentUserId, this.communicationService.userProfileId);
    this.userProfileVisibilityChange.emit(false);
  }
}
