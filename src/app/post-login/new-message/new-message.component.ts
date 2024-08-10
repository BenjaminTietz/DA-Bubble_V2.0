import { Component, inject, OnDestroy } from '@angular/core';
import { ChatInputComponent } from '../shared/chat-input/chat-input.component';
import { ChatService } from '../../services/chat/chat.service';
import { SearchService } from '../../services/search/search.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase/firebase.service';
import { Router } from '@angular/router';
import { CommunicationService } from '../../services/communication/communication.service';
@Component({
  selector: 'app-new-message',
  standalone: true,
  imports: [ChatInputComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './new-message.component.html',
  styleUrl: './new-message.component.scss',
})
export class NewMessageComponent implements OnDestroy {
  chatService = inject(ChatService);
  searchService = inject(SearchService);
  firebaseService = inject(FirebaseService);
  communicationService = inject(CommunicationService);

  searchText: FormGroup;

  searchInput: string = '';

  showUsersByEmail: boolean = false;
  showUsers: boolean = false;
  showChannels: boolean = false;
  isFocusActive: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.searchText = this.fb.group({
      search: [''],
    });
    this.chatService.placeholderName = '';
    if (this.router.url === '/home/new-message') {
      this.chatService.mainCollection = 'newMessage';
    }
  }

  ngOnDestroy() {
    this.searchService.selectedUser = [];
    this.chatService.selectedPrivateChatReciver = '';
    this.searchService.selectedChannel = '';
  }
  // to-do shorten this function
  handleSearch() {
    let searchInput = this.searchText.get('search')?.value || '';
    this.searchInput = searchInput;

    if (searchInput.startsWith('@')) {
      this.isFocusActive = false;
      this.showUsers = true;
      this.showChannels = false;
      this.showUsersByEmail = false;
      this.searchService.onUserSearch(searchInput.slice(1));
    } else if (searchInput.startsWith('#')) {
      this.isFocusActive = false;
      this.showUsers = false;
      this.showUsersByEmail = false;
      this.showChannels = true;
      this.searchService.onChannelSearch(searchInput.slice(1));
    } else if (searchInput.length > 0) {
      this.isFocusActive = false;
      this.showUsers = false;
      this.showChannels = false;
      this.showUsersByEmail = true;
      this.searchService.onEmailSearch(searchInput);
    } else if (searchInput.length == 0) {
      this.isFocusActive = true;
      this.showUsers = false;
      this.searchService.userSearchResults = [];
      this.showChannels = false;
      this.searchService.channelSearchResults = [];
      this.showUsersByEmail = false;
    }
  }

  removeSelectedChannel() {
    this.chatService.mainCollection = '';
    this.chatService.docRef = '';
    this.searchService.selectedChannel = '';
    this.searchText.get('search')?.setValue('');
    this.chatService.placeholderName = '';
  }

  removeSelectedUser(userId: string) {
    this.searchService.removeSelectedUserFromArray(userId);
    this.chatService.mainCollection = '';
    this.chatService.selectedPrivateChatReciver = '';
    this.searchService.selectedUser = [];
    this.searchText.get('search')?.setValue('');
    this.chatService.placeholderName = '';
  }

  handleClickOnUser(userId: string) {
    this.chatService.mainCollection = 'privateChats';
    this.chatService.selectedPrivateChatReciver = userId;
    this.searchService.selectedUser = [userId];
    this.showUsers = false;
    this.showUsersByEmail = false;
    this.isFocusActive = false;
    this.searchText.get('search')?.setValue('');
    this.searchService.unSubscribeOnUserSearch();
    this.chatService.placeholderName = this.firebaseService.getUserDisplayName(userId);
  }

  handleClickOnChannel(chanId: string) {
    this.chatService.mainCollection = 'channels';
    this.chatService.docRef = chanId;
    this.searchService.selectedChannel = chanId;
    this.showChannels = false;
    this.isFocusActive = false;
    this.searchText.get('search')?.setValue('');
    this.searchService.unSubscribeOnChannelSearch();
    this.chatService.initializeChannelPlaceholder(chanId);
  }

  handleFocus() {
    this.isFocusActive = !this.isFocusActive;
    this.showUsers = false;
    this.showChannels = false;
    this.showUsersByEmail = false;
  }
  /**
   * This function is triggered when a message is sent and it calls the sendMessage
   * function with the message text from the event.
   *
   * @param {{ message: string }} event - The event object containing the sent message text.
   * @returns {Promise<void>} A promise that resolves when the message is successfully sent.
   */
  async onMessageSent(event: { message: string; taggedUser: string[]; storageData: string }): Promise<void> {
    if (this.chatService.mainCollection === 'privateChats') {
      await this.chatService.initializePrivateChat(
        this.firebaseService.currentUser.userId,
        this.chatService.selectedPrivateChatReciver,
      );
      await this.chatService.sendMessage(event);
    } else if (this.chatService.mainCollection === 'channels') {
      await this.chatService.sendMessage(event);
      this.router.navigate(['/home/channels', this.chatService.docRef]);
    }
  }
}
