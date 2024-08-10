import { StorageService } from './../../../services/storage/storage.service';
import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
interface MsgData {
  text: string;
}
@Component({
  selector: 'app-thread-history',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PickerComponent],
  templateUrl: './thread-history.component.html',
  styleUrl: './thread-history.component.scss',
})
export class ThreadHistoryComponent implements OnInit, OnDestroy {
  storageService = inject(StorageService);
  firebaseService = inject(FirebaseService);
  chatService = inject(ChatService);
  communicationService = inject(CommunicationService);
  threadService = inject(ThreadService);
  reactionService = inject(ReactionService);
  showEmojiPicker: boolean = false;
  emojiPickerIndex: number = 0;
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
  }

  ngOnInit(): void {
    this.threadService.subscribeAllLists();
    this.messageScrollSubscription = this.threadService.messageScrolled$.subscribe((messageId) => {
      if (messageId) {
        this.scrollToMessage(messageId);
      }
    });
  }

  ngOnDestroy(): void {
    this.threadService.unsubscribeAllLists();
    this.messageScrollSubscription.unsubscribe();
  }

  private scrollToMessage(messageAnswerId: string) {
    setTimeout(() => {
      const element = document.getElementById(messageAnswerId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0); // Delay to ensure DOM is updated
  }

  toggleMsgMenu() {
    this.communicationService.isMsgMenuThreadVisible = !this.communicationService.isMsgMenuThreadVisible;
  }

  toggleEmojiPicker(index: number) {
    this.reactionService.showEmojiPickerThread = !this.reactionService.showEmojiPickerThread;
    this.reactionService.emojiPickerIndexThread = index;
  }

  /**
   * Toggles the visibility of the emoji picker for editing a message.
   */
  toggleEditMsgEmojiPicker() {
    this.reactionService.showEditMsgEmojiPickerThread = !this.reactionService.showEditMsgEmojiPickerThread;
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
   * @param {string} messageAnswerId - The ID of the message to be edited.
   */
  handleClickOnEditMsg(messageAnswerId: string, messageId: string, index: number) {
    this.toggleMsgMenu();
    this.threadService.editMessageAnswerId = messageAnswerId; // set the id of the message to be edited into the chatService
    if (index == 0) {
      this.threadService.editMessageId = messageId;
    }
    this.loadMessageText(); // load the text of the message to be edited
    this.showEditMsgOverlay = true; // show the edit message overlay
  }

  // delete msg functions
  handleClickOnDeleteMsg(messageId: string, messageAnswerId: string) {
    this.toggleMsgMenu();
    this.communicationService.isDeleteThreadMsgDialogVisible = true;
    this.threadService.editMessageId = messageId;
    this.threadService.editMessageAnswerId = messageAnswerId;
  }

  handleClickOnCancelDeleteMsg() {
    this.communicationService.isDeleteThreadMsgDialogVisible = false;
    this.threadService.editMessageAnswerId = '';
  }

  handleClickOnConfirmDeleteMsg(storageDataUrl: string = '') {
    this.communicationService.isDeleteThreadMsgDialogVisible = false;
    if (storageDataUrl) {
      this.storageService.deleteFileByUrl(storageDataUrl);
    }
    this.threadService.deleteMessageAnswer();
  }

  /**
   * Handles the submission of the edited message.
   * Closes the edit message menu, validates the new message text, updates the message, and closes the edit message overlay.
   * Updates the initial message
   * @returns {Promise<void>} A promise that resolves when the message text has been successfully updated.
   */
  async onSubmitEditMsgAnswer() {
    if (this.newMsgData.valid) {
      const updatedText = this.newMsgData.value.text;
      try {
        await this.threadService.updateMessageAnswer(updatedText);
        if (this.threadService.editMessageId) {
          await this.threadService.updateInitialMessage(updatedText);
        }
        this.threadService.editMessageId = '';
        this.showEditMsgOverlay = false;
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
      const text = await this.threadService.getMessageAnswer(); // get the text of the message to be edited
      this.currentMsgData = { text: text }; // set the text of the message to be edited
      this.newMsgData.patchValue({ text: text }); // set the text of the message to be edited in the form
    } catch (error) {
      console.error('Error loading message text:', error);
    }
  }
}
