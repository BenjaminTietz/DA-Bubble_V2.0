import { ThreadService } from './../../../services/thread/thread.service';
import { ChatService } from './../../../services/chat/chat.service';
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { AuthService } from '../../../services/authentication/auth.service';
import { Router, RouterLink, TitleStrategy } from '@angular/router';
import { FirebaseService } from '../../../services/firebase/firebase.service';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../../services/search/search.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommunicationService } from '../../../services/communication/communication.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  chatService = inject(ChatService);
  firebaseService = inject(FirebaseService);
  searchService = inject(SearchService);
  threadService = inject(ThreadService);
  communicationService = inject(CommunicationService);

  searchText: FormGroup;
  //user profile
  @Output() userProfileToggle = new EventEmitter<boolean>();

  constructor(private fb: FormBuilder) {
    this.searchText = this.fb.group({
      search: [''],
    });
  }

  ngOnInit() {}

  onScrollToMessageChat(messageId: string) {
    this.chatService.scrollToMessage(messageId);
  }

  onScrollToMessageThread(messageAnswerId: string) {
    this.threadService.scrollToMessage(messageAnswerId);
  }

  closeSearchAfterMessageClick(id: string) {
    this.chatService.scrollToMessage(id);
    this.handleToggleFocus();
  }

  closeSearchAfterThreadClick(id: string) {
    this.threadService.scrollToMessage(id);
    this.handleToggleFocus();
  }

  handleSearch() {
    const searchInput = this.searchText.get('search')?.value || '';
    this.userSearchActive(searchInput);
    this.channelSearchActive(searchInput);
    this.showAllUsersAndChannels();
    this.searchService.searchSesificMessage(searchInput);
  }

  /**
   * Activates user search and performs a search based on the provided input.
   * @param searchInput - The search input string.
   */
  userSearchActive(searchInput: string) {
    this.communicationService.isHeaderInputVisible = false;
    this.communicationService.showUsers = true;
    this.searchService.onUserSearch(searchInput.slice(1)); // Suche ohne das '@'-Zeichen
  }

  /**
   * Activates the channel search and performs a search based on the provided input.
   * @param searchInput - The search input string.
   */
  channelSearchActive(searchInput: string) {
    this.communicationService.isHeaderInputVisible = false;
    this.communicationService.showChannels = true;
    this.searchService.onChannelSearch(searchInput.slice(1)); // Suche ohne das '#'-Zeichen
  }

  /**
   * Shows all users and channels.
   * Hides the users and channels, sets the focus to active, and unsubscribes from channel and user search.
   */
  showAllUsersAndChannels() {
    if (!this.searchText.value) {
      this.communicationService.showUsers = false;
      this.communicationService.showChannels = false;
      this.communicationService.isHeaderInputVisible = true;
    }
  }

  handleClickOnMember(userId: string) {
    this.searchText.reset();
    this.communicationService.isHeaderInputVisible = false;
    this.communicationService.showUsers = false;
    this.communicationService.showChannels = false;
    this.communicationService.isWelcomeScreenVisible = false;
    this.communicationService.isRouterOutletVisible = true;
    this.chatService.initializePrivateChat(this.firebaseService.currentUserId, userId);
    this.searchService.memberSearchActive = false;
    this.searchService.userSearchResults = [];
    this.searchService.unSubscribeOnUserSearch();
  }

  //user profile functions
  toggleUserProfile(visible: boolean) {
    this.userProfileToggle.emit(visible);
  }

  handleToggleFocus() {
    if (this.communicationService.isHeaderInputVisible) {
      this.searchService.unSubscribeOnChannelSearch();
      this.searchService.unSubscribeOnUserSearch();
    }
    this.communicationService.isHeaderInputVisible = !this.communicationService.isHeaderInputVisible;
    this.searchService.searchSpecificChannelMessageResults = [];
    this.searchService.searchSpecificThreadMessageResults = [];
    this.searchService.userSearchResults = [];
    this.searchService.channelSearchResults = [];
    this.searchText.reset();
    this.communicationService.showChannels = false;
    this.communicationService.showUsers = false;
  }

  /**
   * Handles the click event on a channel.
   * @param channelId - The ID of the channel that was clicked.
   */
  handleClickOnChannel(channelId: string) {
    this.searchText.reset();
    this.communicationService.isHeaderInputVisible = false;
    //unsubscribe from channel search
    this.communicationService.isWelcomeScreenVisible = false;
    this.communicationService.isRouterOutletVisible = true;
    this.router.navigate(['/home/channels', channelId]);
    this.searchService.channelSearchActive = false;
    this.searchService.channelSearchResults = [];
    this.searchService.unSubscribeOnChannelSearch();
  }

  noMessageSearchResult() {
    return (
      !this.searchService.searchSpecificChannelMessageResults.length ||
      !this.searchService.searchSpecificChannelMessageResults.length
    );
  }

  convertUnixTimestampToTime(unixTimestamp: string): string {
    let stringToNumber = parseInt(unixTimestamp, 10); // Specify the base 10 for parsing.
    const date = new Date(stringToNumber);
    const hours = date.getHours().toString().padStart(2, '0'); // Get hours and pad with leading zero if necessary.
    const minutes = date.getMinutes().toString().padStart(2, '0'); // Get minutes and pad with leading zero if necessary.
    const formattedTime = `${hours}:${minutes}`;

    return formattedTime;
  }
}
