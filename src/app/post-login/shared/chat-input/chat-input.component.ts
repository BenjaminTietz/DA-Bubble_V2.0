import { StorageService } from './../../../services/storage/storage.service';
import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { ChatService } from '../../../services/chat/chat.service';
import { FirebaseService } from '../../../services/firebase/firebase.service';
import { CommonModule } from '@angular/common';
import { CommunicationService } from '../../../services/communication/communication.service';
import { getDownloadURL, ref, StorageReference } from '@angular/fire/storage';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [ReactiveFormsModule, PickerComponent, CommonModule],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.scss',
})
export class ChatInputComponent implements OnDestroy, OnInit {
  chatService = inject(ChatService);
  firebaseService = inject(FirebaseService);
  communicationService = inject(CommunicationService);
  storageService = inject(StorageService);
  fileExists: boolean = false;

  @Input() sourceComponent: string = ''; // Variable to hold the source component's name or identifier
  @Input() placeholderText: string = ''; // Variable to hold the placeholder text for the chat input
  @Input() labelId: string = '';
  @Output() messageEvent = new EventEmitter<{
    message: string;
    source: string; // to-do do we need this?
    timestamp: number; // to-do do we need this?
    taggedUser: string[];
    storageData: string;
  }>();

  messageData: FormGroup;
  iconSourceSend = 'assets/img/icons/send_dark_blue.png';

  //emoji picker
  showEmojiPicker: boolean = false;

  // tag list
  showTagContainer: boolean = false;
  // tag List for all users
  showAllUser: boolean = false;
  // tagged users
  taggedUser: string[] = [];
  taggedUserNames: string[] = [];

  // previous message value
  previousMessage: string = '';

  // storgae data
  storageData: string = '';
  fileName: string = '';
  fileType: string = '';

  constructor(private fb: FormBuilder) {
    this.messageData = this.fb.group({
      message: new FormControl('', [Validators.required, Validators.minLength(1)]),
    });
  }

  ngOnInit(): void {
    this.taggedUser = [];
    this.taggedUserNames = [];
    this.storageData = '';
    this.messageData.get('message')?.valueChanges.subscribe((value: string) => {
      this.checkForRemovedTags(value || '');
      this.handleMessageInput(value || '');
      this.previousMessage = value || '';
    });
  }

  ngOnDestroy(): void {
    this.taggedUser = [];
    this.taggedUserNames = [];
    this.storageData = '';
  }

  /**
   * Handles the input value of the message field to determine if the tag container should be shown.
   * Displays the tag container if the input ends with an '@' symbol and it is a valid tagging scenario.
   * Hides the tag container otherwise.
   *
   * @param value - The current input value from the message field.
   *
   * This method performs the following checks:
   * 1. Ensures the input value is a string; if not, it sets the value to an empty string.
   * 2. Checks if the input ends with an '@' symbol.
   * 3. Verifies if the '@' symbol is in a valid position for tagging (e.g., preceded by a space or at the start).
   * 4. Ensures the '@' symbol is not part of an email address.
   * 5. Shows or hides the tag container based on the results of these checks.
   */
  handleMessageInput(value: string) {
    if (typeof value !== 'string') {
      value = '';
    }
    const atSymbolEntered = value.endsWith('@');
    const atIndex = value.lastIndexOf('@');
    const isAtSymbolValid = atIndex !== -1 && (atIndex === 0 || value.charAt(atIndex - 1) === ' ');
    const isEmail = /\S+@\S+\.\S+/.test(value);
    if (atSymbolEntered && isAtSymbolValid && !isEmail) {
      this.showTagContainer = true;
    } else {
      this.showTagContainer = false;
    }
  }

  /**
   * Returns the current time in milliseconds.
   * @returns The current time in milliseconds.
   */
  getCurrentTime(): number {
    return new Date().getTime();
  }

  isStorageDataImage(storageDataUrl: string) {
    return storageDataUrl.includes('jpg') || storageDataUrl.includes('jpeg') || storageDataUrl.includes('png');
  }

  /**
   * Handles the form submission for sending a message.
   * Processes the message data, replaces tagged usernames with their actual names,
   * and emits an event with the formatted message data. Resets the form and clears the tagged users list.
   *
   * This method performs the following steps:
   * 1. Checks if the form is valid; if not, exits the method.
   * 2. Retrieves the current message and processes it to replace tagged usernames with their actual names.
   * 3. Constructs the message object to be sent, including timestamp, message content, source component, storage data, and tagged users.
   * 4. Emits the message event with the constructed message object.
   * 5. Resets the form, clears the tagged users list, and resets storage data.
   *
   * @returns void
   */
  onSubmit(): void {
    if (this.messageData.invalid) {
      return;
    }
    let message = this.messageData.value.message;
    this.taggedUserNames.forEach((userName) => {
      const escapedUserName = userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`@${escapedUserName}`, 'g');
      message = message.replace(regex, userName);
    });
    const messageToSend = {
      timestamp: this.getCurrentTime(), // to-do do we need this?
      message: message,
      source: this.sourceComponent, // to-do do we need this?
      storageData: this.storageData,
      taggedUser: this.taggedUser,
    };
    this.messageEvent.emit(messageToSend);
    this.messageData.reset();
    this.taggedUser = [];
    this.taggedUserNames = [];
    this.storageData = '';
  }

  //emoji code
  /**
   * Toggles the emoji picker visibility.
   */
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  /**
   * Adds the selected emoji to the message text and updates the form control.
   * @param event The event object containing the selected emoji.
   *              The emoji is expected to have a 'native' property representing its textual representation.
   */
  addEmoji(event: { emoji: { native: any } }) {
    let { message } = this.messageData.value;
    let text = `${message}${event.emoji.native}`;
    this.messageData.setValue({ message: text });
    this.toggleEmojiPicker();
  }

  //tag channel member code
  toggleTagContainer() {
    this.showTagContainer = !this.showTagContainer;
  }

  /**
   * Tags a channel member by appending their username to the current message.
   * If the current message does not end with an '@' symbol, it appends one before adding the username.
   * Updates the message field, adds the user ID and username to the respective arrays,
   * and hides the tag container if all members have been tagged.
   *
   * @param userName - The name of the channel member to be tagged.
   * @param userId - The ID of the channel member to be tagged.
   * @param index - The index of the channel in the channel list.
   *
   * @returns void
   */
  tagChannelMember(userName: string, userId: string, index: number) {
    let { message } = this.messageData.value;
    if (!message.endsWith('@')) {
      message += '@';
    }
    let displayMessage = `${message}${userName + ' '}`;
    this.messageData.setValue({ message: displayMessage });
    this.taggedUser.push(userId);
    this.taggedUserNames.push(userName);
    this.showTagContainer = false;
    if (this.taggedUser.length + 1 === this.firebaseService.channelList[index].members.length) {
      this.showTagContainer = false;
    }
  }

  /**
   * Retrieves the list of available members who can be tagged in the current channel.
   * This excludes the current user and members who have already been tagged.
   *
   * @returns {string[]} An array of member IDs who are not the current user and have not yet been tagged.
   */
  getAvailableMembers(): string[] {
    const allMembers = this.firebaseService.channelList.flatMap((channel) => channel.members);
    const taggedMembers = new Set(this.taggedUser);
    return allMembers.filter(
      (memberId) => memberId !== this.firebaseService.currentUserId && !taggedMembers.has(memberId),
    );
  }

  /**
   * Checks if all channel members are tagged.
   *
   * @returns {boolean} True if all channel members are tagged; otherwise, false.
   */
  isAllChannelMembersTagged(): boolean {
    const allChannelMembers =
      this.firebaseService.channelList.find((channel) => channel.chanId === this.chatService.docRef)?.members || [];
    return allChannelMembers
      .filter((memberId) => memberId !== this.firebaseService.currentUserId)
      .every((memberId) => this.taggedUser.includes(memberId));
  }

  // tag all user code

  /**
   * Tags a user by appending their username to the current message.
   * If the current message does not end with an '@' symbol, it appends one before adding the username.
   * Updates the message field, adds the user ID and username to the respective arrays,
   * and hides the tag container.
   *
   * @param userName - The name of the user to be tagged.
   * @param userId - The ID of the user to be tagged.
   *
   * @returns void
   */
  tagUser(userName: string, userId: string) {
    let { message } = this.messageData.value;
    if (!message.endsWith('@')) {
      message += '@';
    }
    let displayMessage = `${message}${userName + ' '}`;
    this.messageData.setValue({ message: displayMessage });
    this.taggedUser.push(userId);
    this.taggedUserNames.push(userName);
    this.showTagContainer = false;
  }

  /**
   * Retrieves the list of users who are not yet tagged and excludes the current user.
   *
   * @returns {any[]} An array of user objects from the userList that are not present in the taggedUser array and are not the current user.
   */
  getAvailableUsers(): any[] {
    const taggedUserIds = new Set(this.taggedUser);
    return this.firebaseService.userList.filter(
      (user) => user.userId !== this.firebaseService.currentUserId && !taggedUserIds.has(user.userId),
    );
  }

  /**
   * Checks if all users are tagged.
   *
   * @returns {boolean} True if all users are tagged; otherwise, false.
   */
  isAllUsersTagged(): boolean {
    const allUserIds = this.firebaseService.userList
      .filter((user) => user.userId !== this.firebaseService.currentUserId)
      .map((user) => user.userId);
    return allUserIds.every((userId) => this.taggedUser.includes(userId));
  }

  /**
   * Checks for removed tags in the current message compared to the previous message.
   * Updates the tagged users and their IDs by removing any tags that are no longer present in the current message.
   *
   * @param currentMessage - The current message to compare against the previous message.
   *
   * This method performs the following steps:
   * 1. Extracts tags from the previous and current messages.
   * 2. Identifies which tags were present in the previous message but are missing in the current message.
   * 3. Removes the corresponding users from the tagged users list.
   */
  checkForRemovedTags(currentMessage: string) {
    const previousTags: string[] = this.previousMessage.match(/@\w+\s\w+/g) || [];
    const currentTags: string[] = currentMessage.match(/@\w+\s\w+/g) || [];
    const removedTags: string[] = previousTags.filter((tag) => !currentTags.includes(tag));

    removedTags.forEach((tag: string) => {
      const userName = tag.slice(1).trim();
      const index = this.taggedUserNames.indexOf(userName);
      if (index !== -1) {
        this.taggedUserNames.splice(index, 1);
        this.taggedUser.splice(index, 1);
      }
    });
  }

  //upload file code
  /**
   * Uploads a file to the storage service and updates the file name and URL.
   * @param event - The event object triggered by the file input change.
   */
  uploadFile(event: Event) {
    this.fileExists = false;
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.item(0);
    this.fileName = file?.name || '';
    this.fileType = file?.type || '';

    if (file) {
      const storageRef = ref(this.storageService.storage, `chatData/${this.chatService.docRef}/${file.name}`);
      // Check if storageRef already exists in the database
      this.storageService.checkIfFileExists(storageRef).subscribe({
        next: (exists) => {
          if (exists) {
            this.fileExists = true;
          } else {
            this.storageService.uploadFile(storageRef, file).subscribe({
              next: (snapshot) => {
                this.storageService.getURL(snapshot.ref).subscribe({
                  next: (url) => {
                    this.storageData = url;
                  },
                });
              },
            });
          }
        },
      });
    }
  }

  /**
   * Closes the chat input and deletes the file from storage.
   */
  closeAndDelete() {
    this.delteFileFromStorage();
    this.storageData = '';
  }

  /**
   * Deletes a file from the storage.
   */
  delteFileFromStorage() {
    const storageRef = ref(this.storageService.storage, `chatData/${this.chatService.docRef}/${this.fileName}`);
    this.storageService.deleteFile(storageRef);
  }
}
