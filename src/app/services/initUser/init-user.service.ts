import { MessageAnswer } from './../../models/messageAnswer.class';
import { inject, Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  DocumentReference,
  Firestore,
  getDocs,
  or,
  query,
  QueryDocumentSnapshot,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { AuthService } from '../authentication/auth.service';
import { User } from '../../models/user.class';
import { PrivateNote } from '../../models/privateNote.class';
import { Message } from '../../models/message.class';
import { Channel } from '../../models/channel.class';
import { PrivateChat } from '../../models/privateChat.class';

@Injectable({
  providedIn: 'root',
})
export class InitUserService {
  authService = inject(AuthService);
  firestore: Firestore = inject(Firestore);
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

  // User ID of actual Guest User
  GuestUserID = '2mpXtCR7UbZbNxDzcMniUIqLNVt2';

  // Demo User IDs
  DemoUser = [
    'GvMTa8fbPnSDP3TTdDeA2ZdDshC2',
    'NjCKLcFp7NYZMZT9qcRggrp996a2',
    'kyDFwOmOfwXMJkLvLNz7EFTBJo52',
    'pyu6zruaHVYjjAOTP9OiICfIhii1',

    'NshI4OaZsdSdN2sS6MBK0MTBQjE3',
    'gAUySY6QUrStjCeILJyQ57mVOi52',
    't7u4PmJK4MVZnP25l7yORCeyA8r2',
    'c1o3mOtxvwS81gi4BwXLAJAXqPa2',
  ];
  // Array of random messages for the private chat
  privateChatMessageText = [
    'Hallo Max, wie geht es dir heute?',
    'Hallo, ich habe eine Frage.',
    'Hast du meine Nachricht gelesen?',
    'Ich habe eine Antwort auf deine Frage.',
    'Hey Max, wie war dein Wochenende?',
    'Max, hast du das Protokoll des letzten Meetings erhalten?',
    'Morgen um 16:00 Uhr ist unser Meeting.',
    'Kannst du mir bitte helfen?',
    'Hier ist die Angular Dokumentation als PDF.',
    'Bitte nutze ab sofort Angular 18.',
  ];

  examplePdfUrl =
    'https://firebasestorage.googleapis.com/v0/b/da-bubble-v2.appspot.com/o/chatData%2FselUN2vXEM4O52xISOL3%2FEbook_The_Ultimate_Guide_to_Angular_Evolution.pdf?alt=media&token=b87a837e-7670-4c5d-b964-848f2fdaf0a2';
  exampleImgUrl =
    'https://firebasestorage.googleapis.com/v0/b/da-bubble-v2.appspot.com/o/chatData%2F8mLbSv4WS6LtbBmxjiaU%2FAngular-18.png?alt=media&token=6f66fa1f-4d99-4e35-89f9-b10af976b4eb';
  /**
   * Sets the initial database entries for a user. This method creates a user document
   * and a private notes document in Firestore with default values.
   *
   * @param {string} [username] - The optional username to set for the user document.
   * @returns {void}
   */
  setInitialDatabaseEntries(username?: string): void {
    const userId = this.authService.firebaseAuth.currentUser!.uid;
    const userDoc = doc(this.firestore, 'users', userId);
    const privateNotesDoc = doc(this.firestore, 'privateNotes', userId);
    setDoc(userDoc, this.setUserObject(username)).then(() => {
      setDoc(privateNotesDoc, this.setPrivateNoteObject()).then(() => {});
    });
  }

  /**
   * Creates a user object with the specified username or default values.
   * This object is used to store user information in Firestore.
   *
   * @param {string} [username] - The optional username to set. If not provided,
   *                              it will use the Firebase user's display name or a default name.
   * @returns {User} The user object containing user data including userId, name, status, photoURL, channels, email, and privateNoteRef.
   */
  setUserObject(username?: string): User {
    const user = this.authService.firebaseAuth.currentUser!;
    const userData = {
      userId: user.uid,
      name: username ? username : user.displayName ? user.displayName : 'Maxi Müller',
      status: true,
      photoURL: user.photoURL
        ? user.photoURL
        : 'https://firebasestorage.googleapis.com/v0/b/da-bubble-v2.appspot.com/o/chatData%2FRaT3kPNmqnAJld2JSuXd%2Fguest_user.png?alt=media&token=252da85a-6bee-4f3b-991f-10e4461008cf',
      channels: ['yh1LXpvXcOWY2hZOEfZ2'],
      email: user.email ? user.email : 'MaxMustermann@gast.com',
      privateNoteRef: user.uid,
    };
    return userData;
  }

  /**
   * Creates a private note object for the current user.
   * This object is used to store a reference to the user's private notes in Firestore.
   *
   * @returns {PrivateNote} The private note object containing the privateNoteId and privateNoteCreator.
   */
  setPrivateNoteObject(): PrivateNote {
    const user = this.authService.firebaseAuth.currentUser!;
    const privateNoteData = {
      privateNoteId: user.uid,
      privateNoteCreator: user.uid,
    };
    return privateNoteData;
  }

  /**
   * Sets up example data for a guest user by clearing existing channels, private chats,
   * and private notes associated with the guest user, and then setting up the guest user data.
   *
   * @returns {void}
   */
  setGuestExampleData(): void {
    const guestId = this.GuestUserID;
    this.clearGuestChannels(guestId).then(() => {
      this.clearGuestPrivateChats(guestId).then(() => {
        this.clearGuestPrivateNotes(guestId).finally(() => {
          this.setGuest(guestId);
        });
      });
    });
  }

  /**
   * Clears all channels associated with the guest user by removing the guest's messages
   * and deleting the guest's membership in each channel which might got created.
   *
   * @param {string} guestId - The ID of the guest user whose channels are to be cleared.
   * @returns {Promise<void>} A promise that resolves when all guest channels and associated messages are cleared.
   */
  clearGuestChannels(guestId: string): Promise<void> {
    const qChannels = query(collection(this.firestore, 'channels'), where('members', 'array-contains', guestId));
    const promise = getDocs(qChannels).then((channelsDocs) => {
      channelsDocs.docs.forEach((channelDoc) => {
        const qMessages = query(collection(channelDoc.ref, 'messages'));
        getDocs(qMessages).then((messagesDocs) => {
          messagesDocs.docs.forEach((messagesDoc) => {
            this.deleteGuestMessages(guestId, messagesDoc).then(() => {});
          });
        });
        this.deleteGuestChannels(guestId, channelDoc).then(() => {});
      });
    });
    return promise;
  }

  /**
   * Clears all private chats associated with the guest user by deleting all messages
   * and their corresponding answers, and then removing the chat documents.
   *
   * @param {string} guestId - The ID of the guest user whose private chats are to be cleared.
   * @returns {Promise<void>} A promise that resolves when all guest private chats and associated messages are cleared.
   */
  clearGuestPrivateChats(guestId: string): Promise<void> {
    const qPrivateChats = query(
      collection(this.firestore, 'privateChats'),
      or(where('chatCreator', '==', guestId), where('chatReciver', '==', guestId)),
    );
    const promise = getDocs(qPrivateChats).then((privateChatsDocs) => {
      privateChatsDocs.docs.forEach((privateChatsDoc) => {
        this.deleteAllMessagesWithAnswers(privateChatsDoc.ref).then(() => {
          deleteDoc(privateChatsDoc.ref).then(() => {});
        });
      });
    });
    return promise;
  }

  /**
   * Clears all private notes associated with the guest user by deleting all messages
   * and their corresponding answers within the guest's private notes document.
   *
   * @param {string} guestId - The ID of the guest user whose private notes are to be cleared.
   * @returns {Promise<void>} A promise that resolves when all messages and answers in the guest's private notes are deleted.
   */
  clearGuestPrivateNotes(guestId: string): Promise<void> {
    const promise = this.deleteAllMessagesWithAnswers(doc(this.firestore, 'privateNotes', guestId)).then(() => {});
    return promise;
  }

  /**
   * Sets up data for a guest user by creating or updating the guest's user document,
   * private notes document, and adding example private chats and channels.
   *
   * @param {string} guestId - The ID of the guest user for whom the data is being set up.
   * @returns {void}
   */
  setGuest(guestId: string): void {
    setDoc(doc(this.firestore, 'users', guestId), this.setUserObject()).then(() => {
      setDoc(doc(this.firestore, 'privateNotes', guestId), this.setPrivateNoteObject()).then(() => {
        this.addGuestExamplePrivateChat().then(() => {
          this.addGuestChannel().then(() => {});
        });
      });
    });
  }

  /**
   * Deletes a message document if it was sent by the guest user, or deletes the message's answers
   * if it was sent by the guest user.
   *
   * @param {string} guestId - The ID of the guest user associated with the message.
   * @param {QueryDocumentSnapshot} messagesDoc - The message document snapshot to be deleted or processed.
   * @returns {Promise<void>} A promise that resolves when the message or its answers are deleted.
   */
  deleteGuestMessages(guestId: string, messagesDoc: QueryDocumentSnapshot): Promise<void> {
    let promise;
    if (messagesDoc.get('messageSendBy') === guestId) {
      promise = deleteDoc(messagesDoc.ref).then(() => {});
    } else {
      promise = this.deleteGuestAnswers(guestId, messagesDoc).then(() => {});
    }
    return promise;
  }

  /**
   * Deletes all message answers associated with a given message that were sent by the guest user.
   * It also updates the answer count of the message document after deleting the answers.
   *
   * @param {string} guestId - The ID of the guest user whose message answers are to be deleted.
   * @param {QueryDocumentSnapshot} messagesDoc - The message document snapshot that contains the answers to be deleted.
   * @returns {Promise<void>} A promise that resolves when all message answers are deleted and the answer count is updated.
   */
  deleteGuestAnswers(guestId: string, messagesDoc: QueryDocumentSnapshot): Promise<void> {
    const qMessageAnswers = query(collection(messagesDoc.ref, 'messageAnswers'), where('messageSendBy', '==', guestId));
    const promise = getDocs(qMessageAnswers).then((messageAnswersDocs) => {
      messageAnswersDocs.docs.forEach((messageAnswerDoc) => {
        deleteDoc(messageAnswerDoc.ref).then(() => {
          const messageAnswerCount = messagesDoc.get('answerCount');
          updateDoc(messagesDoc.ref, { answerCount: messageAnswerCount - 1 }).then(() => {});
        });
      });
    });
    return promise;
  }

  /**
   * Removes the guest user from a channel's member list, and deletes the channel document
   * if the guest user created it. Otherwise, updates the channel document to reflect the
   * removal of the guest user.
   *
   * @param {string} guestId - The ID of the guest user to be removed from the channel.
   * @param {QueryDocumentSnapshot} channelDoc - The channel document snapshot representing the channel to be updated or deleted.
   * @returns {Promise<void>} A promise that resolves when the channel document is updated or deleted.
   */
  deleteGuestChannels(guestId: string, channelDoc: QueryDocumentSnapshot): Promise<void> {
    let members: string[] = channelDoc.get('members');
    const index = members.findIndex((memberId) => memberId === guestId);
    members.splice(index, 1);
    let promise;
    if (channelDoc.get('createdBy') === guestId) {
      promise = deleteDoc(channelDoc.ref).then(() => {});
    } else {
      promise = updateDoc(channelDoc.ref, { members: members }).then(() => {});
    }
    return promise;
  }

  /**
   * Deletes all messages and their associated answers from the specified document reference.
   *
   * @param {DocumentReference} mainDoc - The reference to the main document containing messages and their answers.
   * @returns {Promise<void>} A promise that resolves when all messages and their answers are deleted.
   */
  deleteAllMessagesWithAnswers(mainDoc: DocumentReference): Promise<void> {
    const promise = getDocs(collection(mainDoc, 'messages')).then((docs) => {
      docs.docs.forEach((doc) => {
        getDocs(collection(mainDoc, 'messages', doc.id, 'messageAnswers')).then((docs) => {
          docs.docs.forEach((doc) => {
            deleteDoc(doc.ref).then(() => {});
          });
        });
        deleteDoc(doc.ref).then(() => {});
      });
    });
    return promise;
  }

  /**
   * Adds example private chats for the guest user with predefined demo users.
   * Creates private chat documents and associated messages in a Firestore batch operation.
   *
   * @returns {Promise<void>} A promise that resolves when the batch operation to create private chats and messages is completed.
   * @throws {Error} Throws an error if there is an issue committing the batch operation.
   */
  async addGuestExamplePrivateChat(): Promise<void> {
    const guestUserId = this.GuestUserID;
    const demoUserIds = this.DemoUser;
    const batch = writeBatch(this.firestore);
    demoUserIds.forEach((demoUserId) => {
      const chatId = this.generateUniqueId();
      batch.set(doc(this.firestore, 'privateChats', chatId), this.setGuestPrivateChat(guestUserId, demoUserId));
      batch.set(
        doc(this.firestore, 'privateChats', chatId, 'messages', this.generateUniqueId()),
        this.setGuestPrivateMessage(chatId, demoUserId, guestUserId),
      );
    });
    try {
      await batch.commit();
    } catch (error) {
      console.warn('Error creating private chats and messages:', error);
    }
  }

  /**
   * Adds a guest channel to Firestore, including an initial message and thread messages with answers.
   * This function sets up a channel document, creates a message within that channel,
   * and adds thread messages and their answers.
   *
   * @returns {Promise<void>} A promise that resolves when the channel, message, thread messages,
   * and their answers have been successfully added to Firestore.
   */
  addGuestChannel(): Promise<void> {
    const ids = {
      userId: this.GuestUserID,
      channelId: 'yh1LXpvXcOWY2hZOEfZ2',
      messageId: 'wcn0pm1gYnyxdnGakVQo',
      initialThreadMessageId: 'uZMq0kPFjgNhfsrqj2wr',
      threadAnswerId: 'qxrtLFBMzSjENsgCAUqO',
    };
    const promise = setDoc(doc(this.firestore, 'channels', ids.channelId), this.setGuestChannel(ids.userId)).then(
      () => {
        const newMessage = this.setGuestMessage(ids);
        setDoc(doc(this.firestore, 'channels', ids.channelId, 'messages', ids.messageId), newMessage).then(() => {
          const threadMessage = this.setGuestThreadMessage(ids);
          setDoc(
            doc(
              this.firestore,
              'channels',
              ids.channelId,
              'messages',
              ids.messageId,
              'messageAnswers',
              ids.initialThreadMessageId,
            ),
            threadMessage,
          ).then(() => {
            const threadAnswer = this.setGuestThreadAnswer(ids);
            setDoc(
              doc(
                this.firestore,
                'channels',
                ids.channelId,
                'messages',
                ids.messageId,
                'messageAnswers',
                ids.threadAnswerId,
              ),
              threadAnswer,
            ).then(() => {});
          });
        });
      },
    );
    return promise;
  }

  /**
   * Creates a private chat object for a guest user with a demo user.
   * This object is used to store the private chat information in Firestore.
   *
   * @param {string} guestUserId - The ID of the guest user who is the recipient of the private chat.
   * @param {string} demoUserId - The ID of the demo user who is the creator of the private chat.
   * @returns {PrivateChat} The private chat object containing the privateChatId, chatCreator, and chatReciver.
   */
  setGuestPrivateChat(guestUserId: string, demoUserId: string): PrivateChat {
    const privateChatData = {
      privatChatId: this.generateUniqueId(),
      chatCreator: demoUserId,
      chatReciver: guestUserId,
    };
    return privateChatData;
  }

  /**
   * Creates a private message object for a chat between a sender and a recipient.
   * This object is used to store message details in Firestore.
   *
   * @param {string} chatId - The ID of the chat in which the message is sent.
   * @param {string} senderId - The ID of the user sending the message.
   * @param {string} recipientId - The ID of the user tagged in the message.
   * @returns {Message} The private message object containing message details.
   */
  setGuestPrivateMessage(chatId: string, senderId: string, recipientId: string): Message {
    const randomMessage = this.getRandomMessage();
    let storageData = '';
    if (randomMessage === 'Hier ist die Angular Dokumentation als PDF.') {
      storageData = this.examplePdfUrl;
    } else if (randomMessage === 'Bitte nutze ab sofort Angular 18.') {
      storageData = this.exampleImgUrl;
    }
    const newMessage = {
      answerCount: 0,
      chatId: chatId,
      date: this.convertDate(),
      editCount: 0,
      lastAnswer: '',
      lastEdit: '',
      messageId: this.generateUniqueId(),
      messageSendBy: senderId,
      reactions: [],
      storageData: storageData,
      taggedUser: [recipientId],
      text: randomMessage,
      threadId: '',
      time: Date.now().toString(),
    };
    return newMessage;
  }

  /**
   * Creates a channel object for a guest user with a predefined set of demo users.
   * This object is used to store channel details in Firestore.
   *
   * @param {string} userId - The ID of the guest user who is creating the channel.
   * @returns {Channel} The channel object containing channel details.
   */
  setGuestChannel(userId: string): Channel {
    const members = [userId, ...this.DemoUser];
    const channelData = {
      chanId: '',
      name: 'Gast-Channel',
      description: 'Dies ist ein Beispiel-Channel für den Gast-Benutzer',
      members: members,
      createdAt: this.convertDate(),
      createdBy: userId,
    };
    return channelData;
  }

  /**
   * Creates a message object for a given set of IDs. This object includes details about the message,
   * such as its content, reactions, and metadata.
   *
   * @param {Object} ids - An object containing identifiers for the message and related entities.
   * @param {string} ids.userId - The ID of the user sending the message.
   * @param {string} ids.channelId - The ID of the channel in which the message is sent.
   * @param {string} ids.messageId - The ID of the message.
   * @param {string} ids.initialThreadMessageId - The ID of the initial thread message (if applicable).
   * @param {string} ids.threadAnswerId - The ID of the thread answer (if applicable).
   * @returns {Message} The message object containing the message details, including text, reactions, and metadata.
   */
  setGuestMessage(ids: {
    userId: string;
    channelId: string;
    messageId: string;
    initialThreadMessageId: string;
    threadAnswerId: string;
  }): Message {
    const newMessageData = {
      messageId: 'wcn0pm1gYnyxdnGakVQo',
      text: 'Welche Version von Angular ist die aktuelle?',
      chatId: ids.channelId,
      date: this.convertDate(),
      time: Date.now().toString(),
      messageSendBy: 'GvMTa8fbPnSDP3TTdDeA2ZdDshC2',
      reactions: [
        {
          amount: 4,
          messageId: 'wcn0pm1gYnyxdnGakVQo',
          nativeEmoji: '👍',
          reactionId: '1F44D',
          user: [
            'kyDFwOmOfwXMJkLvLNz7EFTBJo52',
            'pyu6zruaHVYjjAOTP9OiICfIhii1',
            'NshI4OaZsdSdN2sS6MBK0MTBQjE3',
            'gAUySY6QUrStjCeILJyQ57mVOi52',
          ],
        },
      ],
      threadId: '',
      answerCount: 2,
      lastAnswer: Date.now().toString(),
      editCount: 0,
      lastEdit: '',
      taggedUser: [],
      storageData: '',
    };
    return newMessageData;
  }

  /**
   * Creates a thread message answer object for a given set of IDs. This object includes details about the thread message,
   * such as its content, reactions, and metadata.
   *
   * @param {Object} ids - An object containing identifiers for the thread message and related entities.
   * @param {string} ids.userId - The ID of the user sending the thread message answer.
   * @param {string} ids.channelId - The ID of the channel where the thread message is located.
   * @param {string} ids.messageId - The ID of the message to which the thread message answer is associated.
   * @param {string} ids.initialThreadMessageId - The ID of the initial thread message being answered.
   * @param {string} ids.threadAnswerId - The ID of the thread message answer.
   * @returns {MessageAnswer} The thread message answer object containing the message answer details, including text, reactions, and metadata.
   */
  setGuestThreadMessage(ids: {
    userId: string;
    channelId: string;
    messageId: string;
    initialThreadMessageId: string;
    threadAnswerId: string;
  }): MessageAnswer {
    const messageAnswerData = {
      messageAnswerId: '',
      text: 'Welche Version von Angular ist die aktuelle?',
      messageId: ids.initialThreadMessageId,
      date: new Date().toLocaleDateString(),
      time: Date.now().toString(),
      messageSendBy: 'GvMTa8fbPnSDP3TTdDeA2ZdDshC2',
      reactions: [
        {
          amount: 1,
          messageId: 'wcn0pm1gYnyxdnGakVQo',
          nativeEmoji: '👍',
          reactionId: '1F44D',
          user: ['NshI4OaZsdSdN2sS6MBK0MTBQjE3'],
        },
      ],
      editCount: 0,
      lastEdit: '',
      storageData: '',
      taggedUser: [],
    };
    return messageAnswerData;
  }

  /**
   * Creates a thread message answer object for a given set of IDs. This object includes details about the thread message answer,
   * such as its content, reactions, and metadata.
   *
   * @param {Object} ids - An object containing identifiers for the thread message answer and related entities.
   * @param {string} ids.userId - The ID of the user sending the thread message answer.
   * @param {string} ids.channelId - The ID of the channel where the thread message is located.
   * @param {string} ids.messageId - The ID of the message to which the thread message answer is associated.
   * @param {string} ids.initialThreadMessageId - The ID of the initial thread message being answered.
   * @param {string} ids.threadAnswerId - The ID of the thread message answer.
   * @returns {MessageAnswer} The thread message answer object containing the answer details, including text, reactions, and metadata.
   */
  setGuestThreadAnswer(ids: {
    userId: string;
    channelId: string;
    messageId: string;
    initialThreadMessageId: string;
    threadAnswerId: string;
  }): MessageAnswer {
    const messageAnswerData = {
      messageAnswerId: 'ids.threadAnswerId',
      text: 'Es scheint die Version 18.1.1 zu sein.',
      messageId: ids.initialThreadMessageId,
      date: new Date().toLocaleDateString(),
      time: Date.now().toString(),
      messageSendBy: 'NshI4OaZsdSdN2sS6MBK0MTBQjE3',
      reactions: [
        {
          amount: 1,
          messageId: 'wcn0pm1gYnyxdnGakVQo',
          nativeEmoji: '👍',
          reactionId: '1F44D',
          user: ['GvMTa8fbPnSDP3TTdDeA2ZdDshC2'],
        },
      ],
      editCount: 0,
      lastEdit: '',
      storageData:
        'https://firebasestorage.googleapis.com/v0/b/da-bubble-v2.appspot.com/o/chatData%2F8mLbSv4WS6LtbBmxjiaU%2FAngular-18.png?alt=media&token=6f66fa1f-4d99-4e35-89f9-b10af976b4eb',
      taggedUser: ['GvMTa8fbPnSDP3TTdDeA2ZdDshC2'],
    };
    return messageAnswerData;
  }

  /**
   * Converts the current date to a formatted string.
   *
   * @returns {string} The formatted date string.
   */
  convertDate(): string {
    return `${this.weekday[new Date().getDay()]}, ${new Date().getDate()}. ${this.months[new Date().getMonth()]}`;
  }

  /**
   * Generates a unique ID.
   * @returns {string} A unique ID.
   */
  generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9); // Example for unique ID generation
  }

  /**
   * Returns a random message from the privateChatMessageText array.
   * @returns {string} A random message text.
   */
  getRandomMessage(): string {
    const randomIndex = Math.floor(Math.random() * this.privateChatMessageText.length);
    return this.privateChatMessageText[randomIndex];
  }
}
