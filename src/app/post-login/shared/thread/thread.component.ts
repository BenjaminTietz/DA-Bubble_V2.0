import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ThreadHistoryComponent } from '../thread-history/thread-history.component';
import { CommonModule } from '@angular/common';
import { ChatInputComponent } from '../chat-input/chat-input.component';
import { CommunicationService } from '../../../services/communication/communication.service';
import { ThreadService } from '../../../services/thread/thread.service';
import { ChatService } from '../../../services/chat/chat.service';
@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [ThreadHistoryComponent, CommonModule, ChatInputComponent],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent implements OnInit, OnDestroy {
  communicationService = inject(CommunicationService);
  threadService = inject(ThreadService);
  chatService = inject(ChatService);
  constructor() {}

  ngOnInit(): void {
    this.threadService.subscribeAllLists();
    setTimeout(() => {
      this.threadService.scrollToBottom();
    }, 1500);
  }

  ngOnDestroy(): void {
    this.threadService.unsubscribeAllLists();
    this.chatService.editThreadId = '';
    this.threadService.editMessageId = '';
  }

  /**
   * Handles the action when the close button is clicked in the thread interface.
   *
   * This function performs two actions:
   * 1. Sets the visibility of the thread interface to true by calling `toggleThreadVisibility(true)`
   *    on the `communicationService`. This is typically used to hide or show the thread UI.
   * 2. Unsubscribes from all active subscriptions related to threads by calling
   *    `unsubscribeAllLists()` on the `threadService`. This is usually done to clean up resources
   *    and prevent memory leaks when closing or navigating away from the thread interface.
   *
   * @returns {void}
   */
  handleClickOnClose() {
    this.communicationService.toggleThreadVisibility();
    this.threadService.unsubscribeAllLists();
    this.threadService.msgAnswerList = [];
  }
}
