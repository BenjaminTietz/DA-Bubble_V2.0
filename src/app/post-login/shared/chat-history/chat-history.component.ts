import { StorageService } from './../../../services/storage/storage.service';
import { AfterViewChecked, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FirebaseService } from '../../../services/firebase/firebase.service';
import { ChatService } from '../../../services/chat/chat.service';
import { CommunicationService } from '../../../services/communication/communication.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ThreadService } from '../../../services/thread/thread.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { ReactionService } from '../../../services/reactions/reaction.service';
import { Subscription } from 'rxjs';
import { StorageReference } from '@angular/fire/storage';

interface MsgData {
  text: string;
}

@Component({
  selector: 'app-chat-history',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PickerComponent],
  templateUrl: './chat-history.component.html',
  styleUrl: './chat-history.component.scss',
})
export class ChatHistoryComponent implements OnInit, OnDestroy {
  firebaseService = inject(FirebaseService);
  chatService = inject(ChatService);
  communicationService = inject(CommunicationService);
  threadService = inject(ThreadService);
  reactionService = inject(ReactionService);
  storageService = inject(StorageService);

  // Edit message variables
  showEditMsgOverlay: boolean = false;
  currentMsgData: MsgData;
  newMsgData: FormGroup;

  @ViewChild('messageContainer', { static: false }) messageContainer!: ElementRef;
  private messageScrollSubscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
  ) {
    this.currentMsgData = { text: '' };

    this.newMsgData = this.fb.group({
      text: new FormControl('', [Validators.required, Validators.minLength(1)]),
    });

    this.route.url.subscribe((urlSegments) => {
      const mainCollection = urlSegments[0]?.path; // 'channels' or 'privateChats' or 'privateNotes'
      const id = urlSegments[1]?.path; // id aka docRef of the channel or privateChat or privateNote
      this.chatService.mainCollection = mainCollection; //sets the main collection
      this.chatService.docRef = id; //sets the docRef
    });
  }

  ngOnInit(): void {
    this.chatService.subscribeAllLists();
    this.messageScrollSubscription = this.chatService.messageScrolled$.subscribe((messageId) => {
      if (messageId) {
        this.scrollToMessage(messageId);
      }
    });
  }

  ngOnDestroy(): void {
    this.chatService.unsubscribeAllLists();
    this.messageScrollSubscription.unsubscribe();
  }

  private scrollToMessage(messageId: string) {
    setTimeout(() => {
      const element = document.getElementById(messageId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }); // Delay to ensure DOM is updated
  }

  /**
   * Toggles the visibility of the message menu.
   */
  toggleMsgMenu() {
    this.communicationService.isMsgMenuVisible = !this.communicationService.isMsgMenuVisible;
  }

  /**
   * Toggles the visibility of the emoji picker for a specific message.
   * @param {number} index - The index of the message for which the emoji picker should be toggled.
   */
  toggleEmojiPicker(index: number) {
    this.reactionService.showEmojiPicker = !this.reactionService.showEmojiPicker;
    this.reactionService.emojiPickerIndex = index;
  }

  /**
   * Toggles the visibility of the emoji picker for editing a message.
   */
  toggleEditMsgEmojiPicker() {
    this.reactionService.showEditMsgEmojiPicker = !this.reactionService.showEditMsgEmojiPicker;
  }
  /**
   * Handles the event when an emoji is clicked in the emoji picker while editing a message.
   * Adds the clicked emoji to the text of the message being edited.
   * @param {any} event - The event object from the emoji picker, which contains the clicked emoji.
   */
  handleEditMsgEmojiClick(event: any) {
    this.toggleEditMsgEmojiPicker();
    const currentText = this.newMsgData.get('text')?.value || '';
    const newText = currentText + event.emoji.native;
    this.newMsgData.get('text')?.setValue(newText);
  }

  // edit msg functions
  /**
   * Handles the click event for editing a message.
   * Sets the ID of the message to be edited, loads the message text, and shows the edit message overlay.
   *
   * @param {string} messageId - The ID of the message to be edited.
   */
  handleClickOnEditMsg(messageId: string, threadId: string) {
    this.toggleMsgMenu(); // close the edit message menu
    this.chatService.editMessageId = messageId; // set the id of the message to be edited into the chatService
    this.chatService.editThreadId = threadId; // set the id of the thread to be edited into the chatService (if it exists)
    this.loadMessageText(); // load the text of the message to be edited
    this.showEditMsgOverlay = true; // show the edit message overlay
  }

  // delete msg functions
  handleClickOnDeleteMsg(messageId: string) {
    this.toggleMsgMenu();
    this.communicationService.isDeleteMsgDialogVisible = true;
    this.chatService.editMessageId = messageId;
  }

  handleClickOnCancelDeleteMsg() {
    this.communicationService.isDeleteMsgDialogVisible = false;
    this.chatService.editMessageId = '';
  }

  async handleClickOnConfirmDeleteMsg(storageDataUrl: string = '') {
    this.communicationService.isDeleteMsgDialogVisible = false;
    this.communicationService.isThreadVisible = false;
    if (storageDataUrl) {
      this.storageService.deleteFileByUrl(storageDataUrl);
    }
    await this.chatService.deleteMessage();
    this.chatService.unsubscribeAllLists();
    this.chatService.subscribeAllLists();
    this.threadService.unsubscribeAllLists();
  }

  handleClickOnOpenThread(messageId: string): void {
    this.threadService.openExistingThread(messageId);
    this.reactionService.currentThreadId = messageId;
  }

  /**
   * Handles the submission of the edited message. If there is a thread message, updates the thread message text as well.
   * Closes the edit message menu, validates the new message text, updates the message, and closes the edit message overlay.
   *
   * @returns {Promise<void>} A promise that resolves when the message text has been successfully updated.
   */
  async onSubmitEditMsg() {
    if (this.newMsgData.valid) {
      const updatedText = this.newMsgData.value.text;
      try {
        await this.chatService.updateMessage(updatedText);
        if (this.chatService.editThreadId) {
          await this.chatService.updateInitialThreadMessage(updatedText, this.chatService.editThreadId);
        }
        this.showEditMsgOverlay = false;
        this.chatService.editThreadId = '';
      } catch (error) {
        console.error('Error updating message text:', error);
      }
    }
  }

  /**
   * Handles the cancel action for editing a message.
   * Closes the edit message overlay and the edit message menu.
   */
  handleClickOnCancel() {
    this.showEditMsgOverlay = false;
  }

  /**
   * Loads the text of the message to be edited.
   * Fetches the message text from the chat service and sets it in the current message data and form.
   * @returns {Promise<void>} A promise that resolves when the message text is loaded and set.
   */
  async loadMessageText() {
    try {
      const text = await this.chatService.getMessage(); // get the text of the message to be edited
      this.currentMsgData = { text: text }; // set the text of the message to be edited
      this.newMsgData.patchValue({ text: text }); // set the text of the message to be edited in the form
    } catch (error) {
      console.error('Error loading message text:', error);
    }
  }

  checkToday(date: any) {
    const dateToday = new Date();
    const convertedToday = `${this.chatService.weekday[dateToday.getDay()]}, ${dateToday.getDate()}. ${
      this.chatService.months[dateToday.getMonth()]
    }`;

    if (date != convertedToday) {
      return date;
    } else {
      return 'Heute';
    }
  }
}
