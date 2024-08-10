import { inject, Injectable } from '@angular/core';
import { FirebaseService } from '../firebase/firebase.service';
import {
  query,
  orderBy,
  Firestore,
  collection,
  doc,
  onSnapshot,
  updateDoc,
  getDocs,
  addDoc,
  getDoc,
  deleteDoc,
  increment,
  DocumentReference,
} from '@angular/fire/firestore';
import { Message } from '../../models/message.class';
import { PrivateChat } from '../../models/privateChat.class';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { CommunicationService } from '../communication/communication.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  firebaseService = inject(FirebaseService);
  firestore: Firestore = inject(Firestore);
  communicationService = inject(CommunicationService);
  msgList: Message[] = [];

  unsubscribeMsgList: any;
  unsubscribeMsgAnswerList: any;
  newPrivateChatId: string = '';
  placeholderName: string = '';
  chatCreator = '';
  mainCollection: string = '';
  docRef: string = '';
  editMessageId: string = '';
  editThreadId: string = '';
  messageId: string = '';

  selectedPrivateChatReciver: string = '';
  weekday = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  months = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ];

  private messageScrolledSource = new BehaviorSubject<string | null>(null);
  messageScrolled$ = this.messageScrolledSource.asObservable();
  firebaseAuth: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  /**
   * Subscribes to all necessary lists for the chat service.
   */
  subscribeAllLists() {
    this.subscribeMsgList();
  }

  /**
   * Unsubscribes to all lists for the chat service.
   */
  unsubscribeAllLists() {
    if (this.unsubscribeMsgList) {
      this.unsubscribeMsgList();
    }
  }

  // code for fetching messages from private chat or channels
  /**
   * Subscribes to the messages subcollection and updates the message list in real-time.
   * Orders the messages by the 'date' and then 'time' field.
   */
  subscribeMsgList() {
    if (this.unsubscribeMsgList) {
      this.unsubscribeMsgList();
    }
    const collectionRef = collection(this.firestore, this.mainCollection, this.docRef, 'messages');
    const q = query(collectionRef, orderBy('date'), orderBy('time'));
    this.unsubscribeMsgList = onSnapshot(
      q,
      (snapshot) => {
        this.msgList = [];
        snapshot.forEach((doc) => {
          const msg = this.setMessage(doc.data(), doc.id);
          this.msgList.push(msg);
          this.scrollToBottom();
        });
      },
      (error) => {
        console.warn('Error fetching messages: ', error);
      },
    );
  }

  /**
   * Formats the message data into a Message object.
   *
   * @param {any} obj - The message data from the Firestore document.
   * @param {string} id - The ID of the Firestore document.
   * @returns {Message} The formatted message object.
   */
  setMessage(obj: any, id: string): Message {
    return {
      messageId: id || '',
      text: obj.text || '',
      chatId: obj.chatId || '',
      date: obj.date || '',
      time: obj.time || '',
      messageSendBy: obj.messageSendBy || '',
      reactions: obj.reactions || [],
      threadId: obj.threadId || '',
      answerCount: obj.answerCount || 0,
      lastAnswer: obj.lastAnswer || '',
      editCount: obj.editCount || 0,
      lastEdit: obj.lastEdit || '',
      storageData: obj.storageData || '',
      taggedUser: obj.taggedUser || [],
    };
  }

  /**
   * Retrieves a specific message from Firestore based on the document reference and message ID.
   *
   * This method fetches the message document from the Firestore database, extracts the 'text' field from the document,
   * and returns it as a string. If the document does not exist or if there is an error during retrieval, the method
   * will throw an error. The method uses async/await for asynchronous operations and handles errors with a try/catch block.
   *
   * @returns {Promise<string>} A promise that resolves to the text of the message. If the message field does not exist,
   *                            an empty string is returned.
   * @throws {Error} Throws an error if the document does not exist or if there is an issue retrieving the document.
   */
  async getMessage(): Promise<string> {
    try {
      const messageDocRef = doc(this.firestore, `${this.mainCollection}/${this.docRef}/messages/${this.editMessageId}`);
      const docSnap = await getDoc(messageDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data['text'] || '';
      } else {
        throw new Error('No such document!');
      }
    } catch (error) {
      console.warn('Error getting message:', error);
      throw error;
    }
  }

  /**
   * Updates the text of a specific message in Firestore and increments its edit count.
   *
   * This method updates the 'text' field of a message document in the Firestore database with the provided new text.
   * Additionally, it increments the 'editCount' field to track how many times the message has been edited and updates
   * the 'lastEdit' field with the current timestamp. The method uses async/await for asynchronous operations and handles
   * errors with a try/catch block.
   *
   * @param {string} newText - The new text to set for the message. This string will replace the existing text in the
   *                            Firestore document.
   * @returns {Promise<void>} A promise that resolves when the update operation is complete. It does not return any
   *                          value.
   * @throws {Error} Throws an error if the update operation fails.
   */
  async updateMessage(newText: string): Promise<void> {
    try {
      const messageDocRef = doc(this.firestore, `${this.mainCollection}/${this.docRef}/messages/${this.editMessageId}`);
      await updateDoc(messageDocRef, {
        text: newText,
        editCount: increment(1),
        lastEdit: Date.now().toString(),
      });
    } catch (error) {
      console.warn('Error updating message text:', error);
      throw error;
    }
  }

  /**
   * Updates the text of a thread messageAnswer document in Firestore.
   *
   * This function updates the text of a message in the messageAnswer subcollection.
   * It increments the edit count and sets the last edit time to the current system time in milliseconds.
   *
   * @param {string} newText - The new text to update in the thread message document.
   * @param {string} threadId - The ID of the thread message document to be updated.
   * @returns {Promise<void>} A promise that resolves when the thread message text is updated.
   * @throws Will throw an error if the update operation fails.
   */
  async updateInitialThreadMessage(newText: string, threadId: string): Promise<void> {
    try {
      const messageDocRef = doc(
        this.firestore,
        `${this.mainCollection}/${this.docRef}/messages/${this.editMessageId}/messageAnswers/${threadId}`,
      );
      await updateDoc(messageDocRef, {
        text: newText,
        editCount: increment(1),
        lastEdit: Date.now().toString(),
      });
    } catch (error) {
      console.warn('Error updating message text:', error);
      throw error;
    }
  }

  /**
   * Deletes a message document from Firestore, including all documents in the messageAnswers subcollection.
   *
   * @returns {Promise<void>} A promise that resolves when the message and its subcollection are successfully deleted.
   * @throws Will throw an error if the deletion fails.
   */
  async deleteMessage(): Promise<void> {
    try {
      const messageDocRef = doc(this.firestore, `${this.mainCollection}/${this.docRef}/messages/${this.editMessageId}`);
      await this.deleteSubcollection(messageDocRef);
      await deleteDoc(messageDocRef);
    } catch (error) {
      console.warn('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Deletes all documents in a given subcollection.
   *
   * @param {DocumentReference} messageDocRef - A reference to the message document whose subcollection is to be deleted.
   * @returns {Promise<void>} A promise that resolves when the subcollection is successfully deleted.
   * @throws Will throw an error if the deletion fails.
   */
  async deleteSubcollection(messageDocRef: DocumentReference): Promise<void> {
    try {
      const subcollectionRef = collection(messageDocRef.firestore, messageDocRef.path, 'messageAnswers');
      const querySnapshot = await getDocs(subcollectionRef);
      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.warn('Error deleting subcollection:', error);
      throw error;
    }
  }

  //code for privateChats
  /**
   * Checks if a chat between the chatCreator and chatReceiver already exists.
   * If the chat exists, navigates to the existing chat.
   * If the chat does not exist, creates a new chat in the Firestore database updateds to new doc with its own Id and navigates to it.
   * @param {string} chatCreator - The user ID of the person initiating the chat.
   * @param {string} chatReceiver - The user ID of the person receiving the chat invitation.
   */
  async initializePrivateChat(chatCreator: string, chatReceiver: string) {
    try {
      const existingChatId = await this.checkIfPrivateChatExists(chatReceiver, chatCreator);
      if (this.redirectIfChatExists(existingChatId)) {
        return;
      }
      let newPrivateChat: PrivateChat = {
        privatChatId: '',
        chatCreator: chatCreator,
        chatReciver: chatReceiver,
      };
      const docRef = await this.addPrivateChat(newPrivateChat);
      await this.updatePrivateChatId(docRef);
    } catch (error) {
      console.warn('Error starting new private chat:', error);
      throw error;
    }
  }

  /**
   * Adds a new private chat document to the Firestore database & redirects to the newly created chat.
   *
   * @param {PrivateChat} privateChatData - The data for the new private chat.
   * @returns {Promise<any>} A promise that resolves with the document reference of the newly added chat.
   * @throws {Error} Throws an error if adding the document fails.
   */
  async addPrivateChat(privateChatData: PrivateChat): Promise<any> {
    try {
      const docRef = await addDoc(collection(this.firestore, 'privateChats'), privateChatData);
      this.router.navigate(['/home/privateChats', docRef.id]);
      return docRef;
    } catch (e) {
      console.warn('Error adding document: ', e);
      throw e;
    }
  }

  /**
   * Checks if a private chat between the given chatCreator and chatReceiver exists.
   * @param {string} chatReceiver - The ID of the chat receiver.
   * @param {string} chatCreator - The ID of the chat creator.
   * @returns {Promise<string | null>} A promise that resolves to the chat ID if the chat exists, otherwise null.
   */
  checkIfPrivateChatExists(chatReceiver: string, chatCreator: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      try {
        const existingChat = this.firebaseService.privateChatList.find(
          (chat) =>
            (chat.chatCreator === chatCreator && chat.chatReciver === chatReceiver) ||
            (chat.chatCreator === chatReceiver && chat.chatReciver === chatCreator),
        );
        if (existingChat) {
          resolve(existingChat.privatChatId);
        } else {
          resolve(null);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Redirects to an existing chat if it exists.
   * @param {string | null} existingChatId - The ID of the existing chat, or null if no chat exists.
   * @returns {boolean} True if redirected, otherwise false and a new chat is created and navigated to.
   */
  redirectIfChatExists(existingChatId: string | null): boolean {
    if (existingChatId) {
      this.router.navigate(['/home/privateChats', existingChatId]);
      return true;
    }
    return false;
  }

  /**
   * Updates the private chat document with its own ID in the Firestore database.
   *
   * @param {any} docRef - The document reference of the newly added private chat.
   * @returns {Promise<void>} A promise that resolves when the document has been successfully updated.
   * @throws {Error} Throws an error if updating the document fails.
   */
  async updatePrivateChatId(docRef: any): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, 'privateChats', docRef.id), { privatChatId: docRef.id });
      this.newPrivateChatId = docRef.id;
    } catch (e) {
      console.warn('Error updating document: ', e);
      throw e;
    }
  }

  /**
   * This function is triggered when a message is sent and it calls the sendMessage
   * function with the message text from the event.
   *
   * @param {{ message: string }} event - The event object containing the sent message text.
   * @returns {Promise<void>} A promise that resolves when the message is successfully sent.
   */
  async onMessageSent(event: { message: string; taggedUser?: string[]; storageData?: string }): Promise<void> {
    await this.sendMessage(event);
  }

  /**
   * Sends a message to a private chat or channel by creating a new message document in the messages subcollection to the Firestore database and updates the message document with the generated message ID.
   *
   * This method creates a new message object with the provided details, including the message text, optionally tagged users,
   * and any associated storage data. It then adds this message to the Firestore collection and updates the document with
   * the generated message ID. The method uses async/await for asynchronous operations and handles errors with a try/catch block.
   *
   * @param {Object} event - An object containing the details of the message to be sent.
   * @param {string} event.message - The text content of the message to be sent.
   * @param {string[]} [event.taggedUser] - Optional. An array of user IDs representing the users tagged in the message.
   * @param {string} [event.storageData] - Optional. A string representing any associated storage data (e.g., file URL).
   * @returns {Promise<void>} A promise that resolves when the message has been successfully sent and the message ID has
   *                          been updated. It does not return any value.
   * @throws {Error} Throws an error if adding the message to Firestore or updating the message ID fails.
   */
  async sendMessage(event: { message: string; taggedUser?: string[]; storageData?: string }): Promise<void> {
    let newMessage: Message = {
      messageId: '',
      text: event.message,
      chatId: this.docRef,
      date: this.convertDate(),
      time: Date.now().toString(),
      messageSendBy: this.firebaseService.currentUser.userId,
      reactions: [],
      threadId: '',
      answerCount: 0,
      lastAnswer: '',
      editCount: 0,
      lastEdit: '',
      taggedUser: event.taggedUser || [],
      storageData: event.storageData || '',
    };
    const docRef = await this.addMessage(newMessage);
    await this.updateMessageId(docRef);
  }

  /**
   * Adds a new message document to the messages subcollection of a private chat or a channel.
   *
   * @param {Message} messageData - The data of the new message.
   * @returns {Promise<any>} A promise that resolves with the document reference of the newly added message.
   */
  addMessage(messageData: Message): Promise<any> {
    try {
      const collectionRef = collection(this.firestore, this.mainCollection, this.docRef, 'messages');
      return addDoc(collectionRef, messageData);
    } catch (e) {
      console.warn('Error adding message document: ', e);
      throw e;
    }
  }

  /**
   * Updates the message document with its own ID in the messages subcollection of a private chat.
   *
   * @param {any} docRef - The document reference of the newly added message.
   * @returns {Promise<void>} A promise that resolves when the document has been successfully updated.
   * @throws {Error} Throws an error if updating the document fails.
   *
   */
  async updateMessageId(docRef: any): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, this.mainCollection, this.docRef, 'messages', docRef.id), {
        messageId: docRef.id,
      });
    } catch (e) {
      console.warn('Error updating message document: ', e);
      throw e;
    }
  }

  /**
   * This function sets the threadId field of a specific message document to the provided threadId.
   *
   * @param {string} messageId - The ID of the message document to be updated.
   * @param {string} threadId - The thread ID to set in the message document.
   * @returns {Promise<void>} A promise that resolves when the threadId field is successfully updated.
   * @throws Will throw an error if the update operation fails.
   */
  async updateMessageThreadId(messageId: string, threadId: string): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, this.mainCollection, this.docRef, 'messages', messageId), {
        threadId: threadId,
      });
    } catch (e) {
      console.warn('Error updating message document: ', e);
      throw e;
    }
  }

  // code for placeholder of the shared inputfield
  /**
   * Initializes the  placeholder name based on the provided chat ID for the shared inputfiled.
   * If the current user is the chat creator, sets the chat receiver to the chat receiver from the chat data.
   * Otherwise, sets the chat receiver to the chat creator.
   * Sets the chat placeholder name based on the chat creator's user ID.
   * Retrieves the display name of the user corresponding to `chatCreator` and assigns it to `placeholderName`.
   * @param {string} chatId - The ID of the chat to initialize the placeholder for.
   */
  initializeChatPlaceholder(chatId: string): void {
    const chatData = this.firebaseService.privateChatList.find((chat) => chat.privatChatId === chatId);
    if (chatData) {
      if (chatData.chatCreator === this.firebaseService.currentUserId) {
        this.chatCreator = chatData.chatReciver;
      } else {
        this.chatCreator = chatData.chatCreator;
      }
      let placeholderName = this.firebaseService.getUserDisplayName(this.chatCreator);
      this.placeholderName = placeholderName;
    } else {
      console.warn('Chat not found or chatCreator field does not exist in the chat data!');
    }
  }

  /**
   * Initializes the channel placeholder name based on the provided channel ID for the shared inputfiled.
   * Searches for the channel in the `channelList` using the `channelId` and sets the `placeholderName` to the channel's name.
   * @param {string} channelId - The ID of the channel to initialize the placeholder for.
   */
  initializeChannelPlaceholder(channelId: string): void {
    const channelData = this.firebaseService.channelList.find((channel) => channel.chanId === channelId);
    if (channelData) {
      this.placeholderName = channelData.name;
    } else {
      console.warn('Channel not found or name field does not exist in the channel data!');
    }
  }

  // general helper functions code to display messages
  /**
   * Formats a Unix timestamp string into the format "HH:mm Uhr".
   *
   * @param {string} timestampStr - The Unix timestamp string to be formatted.
   * @returns {string} The formatted time string in the format "HH:mm Uhr".
   * @throws {Error} Throws an error if the input format is incorrect.
   */
  formatTimeString(timestampStr: string): string {
    const timestamp = parseInt(timestampStr, 10);
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} Uhr`;
  }

  /**
   * Converts the current date into a formatted string representation.
   *
   * The method returns a string that represents the current date in the format:
   * `[Weekday], [Day of Month]. [Month]`.
   * For example, if today is August 5, 2024, and it's a Monday, it will return:
   * `"Monday, 5. August"`.
   *
   * The formatting is based on the `weekday` and `months` arrays, which should contain the names of the days of the week
   * and months, respectively. The method uses the current date obtained from `new Date()` to generate the formatted string.
   *
   * @returns {string} A formatted string representing the current date.
   */
  convertDate() {
    return `${this.weekday[new Date().getDay()]}, ${new Date().getDate()}. ${this.months[new Date().getMonth()]}`;
  }

  /**
   * Handles the user click event by toggling the visibility of user profiles and updating
   * the profile ID based on the selected user.
   *
   * This method performs the following actions:
   * - Hides the channel member list by setting its visibility to false.
   * - Checks if the clicked user is the current user. If so, it toggles the visibility
   *   of the current user's profile.
   * - If the clicked user is not the current user, it toggles the visibility of that user's profile
   *   and updates the profile ID to the ID of the clicked user.
   *
   * @param {string} userId - The ID of the user that was clicked.
   *
   */
  handleClickOnUser(userId: string) {
    this.communicationService.toggleChannelMemberVisibility(false);
    if (this.firebaseService.currentUserId === userId) {
      this.communicationService.toggleCurrentUserProfileVisibility(true);
    } else {
      this.communicationService.toggleUserProfileVisibility(true);
      this.communicationService.userProfileId = userId;
    }
  }

  /**
   * Emits an event with the given message ID to scroll to that message.
   * This method sends the message ID through the `messageScrolledSource` observable,
   * which can be subscribed to in order to perform the scrolling action.
   *
   * @param messageId - The ID of the message to scroll to.
   *
   * @returns void
   */
  scrollToMessage(messageId: string) {
    this.messageScrolledSource.next(messageId);
  }

  /**
   * Scrolls to the last message in the message list.
   * If the message list is empty, the method does nothing.
   * Otherwise, it retrieves the ID of the last message and calls `scrollToMessage` to perform the scroll.
   *
   * @returns void
   */
  scrollToBottom() {
    if (this.msgList.length === 0) {
      return;
    } else {
      const lastMessage = this.msgList[this.msgList.length - 1];
      const messageId = lastMessage.messageId;
      this.scrollToMessage(messageId);
    }
  }
}
