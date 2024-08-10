import { SearchService } from './../../../services/search/search.service';
import { CommunicationService } from './../../../services/communication/communication.service';
import { FirebaseService } from './../../../services/firebase/firebase.service';
import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatInputComponent } from '../../shared/chat-input/chat-input.component';
import { ChatService } from '../../../services/chat/chat.service';
import { ChannelDetailsComponent } from './channel-details/channel-details.component';
import { ChatHistoryComponent } from '../../shared/chat-history/chat-history.component';
import { ActivatedRoute } from '@angular/router';
import { ChannelMemberComponent } from './channel-member/channel-member.component';
import { ThreadService } from '../../../services/thread/thread.service';
@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [CommonModule, ChatInputComponent, ChannelDetailsComponent, ChatHistoryComponent, ChannelMemberComponent],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss',
})
export class ChannelComponent implements OnInit, OnDestroy {
  chatService = inject(ChatService);
  communicationService = inject(CommunicationService);
  firebaseService = inject(FirebaseService);
  threadService = inject(ThreadService);
  searchService = inject(SearchService);

  showChannelDetails = false;
  showAddMembersToChannel = false;

  @Input() isChannelMemberVisible: boolean = false;
  @Output() channelMemberVisibilityChange = new EventEmitter<boolean>();

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe((params) => {
      this.chatService.docRef = params['id'];
    });
    // to-do settimeout is needed in case user refreshes the page, otherwise the placeholder is not set because the channelList is not yet loaded
    this.chatService.initializeChannelPlaceholder(this.chatService.docRef);
    this.chatService.editThreadId = '';
    this.threadService.editMessageId = '';
  }

  ngOnInit(): void {
    this.chatService.subscribeAllLists();
  }

  ngOnDestroy(): void {
    this.chatService.unsubscribeAllLists();
    this.threadService.unsubscribeAllLists();
    this.chatService.editThreadId = '';
    this.threadService.editMessageId = '';
  }

  /**
   * Returns the left style value for a chat component item based on the given index.
   * @param index - The index of the chat component item.
   * @returns The left style value as a string.
   */
  getLeftStyleValue(index: number): string {
    if (index === 0) {
      return (0.5 * 21).toString();
    } else if (index === 1) {
      return (index * 35).toString();
    } else {
      return (index * 30).toString();
    }
  }

  toggleShowChannelDetails() {
    this.communicationService.toggleChannelDetailsVisibility(!this.showChannelDetails);
  }

  toggleAddMembersToChannel() {
    this.communicationService.toggleAddMembersToChannelVisibility(!this.showAddMembersToChannel);
  }

  handleClickOnMember() {
    this.communicationService.toggleChannelMemberVisibility(true);
  }
}
