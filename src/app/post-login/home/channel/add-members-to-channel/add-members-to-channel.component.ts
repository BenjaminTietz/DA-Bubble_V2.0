import { SearchService } from './../../../../services/search/search.service';
import { ChatService } from './../../../../services/chat/chat.service';

import { FormsModule, NgModel } from '@angular/forms';
import { FirebaseService } from './../../../../services/firebase/firebase.service';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { ChannelMemberSelectionComponent } from '../../../shared/channel-member-selection/channel-member-selection.component';
import { doc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-add-members-to-channel',
  standalone: true,
  imports: [FormsModule, NgClass, CommonModule, ChannelMemberSelectionComponent],
  templateUrl: './add-members-to-channel.component.html',
  styleUrl: './add-members-to-channel.component.scss',
})
export class AddMembersToChannelComponent {
  @Input() isAddMembersToChannelVisible = false;
  @Output() addMembersToChannelVisibilityChange = new EventEmitter<boolean>();
  userName = '';
  firebaseService = inject(FirebaseService);
  chatService = inject(ChatService);
  searchService = inject(SearchService);
  displayUsers = false;

  ngOnDestroy(): void {
    this.searchService.memberSearchActive = false;
    this.searchService.selectedUser = [];
    this.userName = '';
  }

  closeWindow(): void {
    this.addMembersToChannelVisibilityChange.emit(false);
  }

  toggleDisplayUsers() {
    this.searchService.memberSearchActive = !this.searchService.memberSearchActive;
  }

  async handleAddMember() {
    await this.firebaseService.updateChannelMembersArray(this.chatService.docRef, this.searchService.selectedUser);
    await this.firebaseService.updateUserChannelsArray(this.searchService.selectedUser, this.chatService.docRef);
    this.addMembersToChannelVisibilityChange.emit(false);
  }
}
