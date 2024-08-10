import { Component, EventEmitter, inject, Inject, Input, Output } from '@angular/core';
import { FirebaseService } from '../../../../services/firebase/firebase.service';
import { CommonModule } from '@angular/common';
import { CommunicationService } from '../../../../services/communication/communication.service';
import { ChatService } from '../../../../services/chat/chat.service';
@Component({
  selector: 'app-channel-member',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channel-member.component.html',
  styleUrl: './channel-member.component.scss',
})
export class ChannelMemberComponent {
  firebaseService = inject(FirebaseService);
  communicationService = inject(CommunicationService);
  chatService = inject(ChatService);
  @Input() isChannelMemberVisible: boolean = false;
  @Output() channelMemberVisibilityChange = new EventEmitter<boolean>();

  /**
   * Handles the click event on a member ond toggles the visibility of the user profile or the current user profile.
   *
   * @param {string} memberId - The ID of the member that was clicked.
   */
  handleClickOnMember(memberId: string) {
    this.communicationService.toggleChannelMemberVisibility(false);
    if (this.firebaseService.currentUserId === memberId) {
      this.communicationService.toggleCurrentUserProfileVisibility(true);
    } else {
      this.communicationService.toggleUserProfileVisibility(true);
      this.communicationService.userProfileId = memberId;
    }
  }

  /**
   * Closes the channel member window.
   * and sets the visibility of the channel member window to false.
   * Opens the add member window.
   */
  openAddMember() {
    this.communicationService.toggleAddMembersToChannelVisibility(true);
    this.communicationService.toggleChannelMemberVisibility(false);
  }
}
