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
  ];

  /**
   * Sets initial database entries for the logged-in user.
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
   * Creates a user object for Firestore. (for every user registering with email and password & sets up example data)
   * @param {string} [username] - Optional username for the user.
   * @returns {Object} The user object.
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
   *
   * @returns {Object} An object containing the private chat ID and private note creator ID.
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
   * Clears all data associated with a guest user then sets up example data for the guest user.
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
   * Clears all channels associated with a guest user.
   *
   * @param {string} guestId - The ID of the guest user.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
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
   * Clears all private chats associated with a guest user.
   *
   * @param {string} guestId - The ID of the guest user.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
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
   * Clears all private notes associated with a guest user.
   *
   * @param {string} guestId - The ID of the guest user.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  clearGuestPrivateNotes(guestId: string): Promise<void> {
    const promise = this.deleteAllMessagesWithAnswers(doc(this.firestore, 'privateNotes', guestId)).then(() => {});
    return promise;
  }

  /**
   * Sets up the guest user with initial data.
   *
   * @param {string} guestId - The ID of the guest user.
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
   * Deletes messages sent by the guest user or the answers to those messages.
   *
   * @param {string} guestId - The ID of the guest user.
   * @param {QueryDocumentSnapshot} messagesDoc - The document snapshot of the message.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
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
   * Deletes answers sent by the guest user.
   *
   * @param {string} guestId - The ID of the guest user.
   * @param {QueryDocumentSnapshot} messagesDoc - The document snapshot of the message.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
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
   * Deletes channels created by or containing the guest user.
   *
   * @param {string} guestId - The ID of the guest user.
   * @param {QueryDocumentSnapshot} channelDoc - The document snapshot of the channel.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
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
   * Deletes all messages and their answers within a document.
   *
   * @param {DocumentReference} mainDoc - The document reference containing the messages.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
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
   * Adds private chats between each demo user and the guest user, with individual messages.
   *
   * @returns {Promise<void>} A promise that resolves when all operations are complete.
   */
  async addGuestExamplePrivateChat(): Promise<void> {
    const guestUserId = this.GuestUserID;
    const demoUserIds = this.DemoUser;

    const batch = writeBatch(this.firestore);

    demoUserIds.forEach((demoUserId) => {
      const chatId = this.generateUniqueId(); // Generate a unique chat ID

      batch.set(doc(this.firestore, 'privateChats', chatId), this.setGuestPrivateChat(guestUserId, demoUserId));

      batch.set(
        doc(this.firestore, 'privateChats', chatId, 'messages', this.generateUniqueId()), // Generate a unique message ID
        this.setGuestPrivateMessage(chatId, demoUserId, guestUserId),
      );
    });

    try {
      // Commit the batch
      await batch.commit();
    } catch (error) {
      console.warn('Error creating private chats and messages:', error);
    }
  }

  /**
   * Adds an example channel for the guest user.
   *
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
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
   * Creates a private chat object for the guest user and a demo user.
   *
   * @param {string} guestUserId - The ID of the guest user.
   * @param {string} demoUserId - The ID of the demo user.
   * @returns {Object} The private chat object.
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
   * Creates a private message object for the guest user and a demo user.
   *
   * @param {string} chatId - The ID of the private chat.
   * @param {string} senderId - The ID of the user sending the message.
   * @param {string} recipientId - The ID of the user receiving the message.
   * @returns {Object} The private message object.
   */
  setGuestPrivateMessage(chatId: string, senderId: string, recipientId: string): Object {
    const randomMessage = this.getRandomMessage();
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
      storageData: '',
      taggedUser: [recipientId],
      text: randomMessage,
      threadId: '',
      time: Date.now().toString(),
    };
    return newMessage;
  }

  /**
   * Creates a channel object for the guest user.
   *
   * @param {string} userId - The ID of the guest user.
   * @returns {Object} The channel object.
   */
  setGuestChannel(userId: string): Object {
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
   * Creates a message object for the guest user.
   *
   * @param {Object} ids - The IDs for the message.
   * @param {string} ids.userId - The ID of the guest user.
   * @param {string} ids.channelId - The ID of the channel.
   * @param {string} ids.messageId - The ID of the message.
   * @param {string} ids.initialThreadMessageId - The ID of the initial thread message.
   * @param {string} ids.threadAnswerId - The ID of the thread answer.
   * @returns {Object} The message object.
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
   * Creates a thread message object for the guest user.
   *
   * @param {Object} ids - The IDs for the thread message.
   * @param {string} ids.userId - The ID of the guest user.
   * @param {string} ids.channelId - The ID of the channel.
   * @param {string} ids.messageId - The ID of the message.
   * @param {string} ids.initialThreadMessageId - The ID of the initial thread message.
   * @param {string} ids.threadAnswerId - The ID of the thread answer.
   * @returns {Object} The thread message object.
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
   * Creates a thread answer object for the guest user.
   *
   * @param {Object} ids - The IDs for the thread answer.
   * @param {string} ids.userId - The ID of the guest user.
   * @param {string} ids.channelId - The ID of the channel.
   * @param {string} ids.messageId - The ID of the message.
   * @param {string} ids.initialThreadMessageId - The ID of the initial thread message.
   * @param {string} ids.threadAnswerId - The ID of the thread answer.
   * @returns {Object} The thread answer object.
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
