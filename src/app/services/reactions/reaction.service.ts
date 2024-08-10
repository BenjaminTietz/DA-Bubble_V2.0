import { inject, Injectable } from '@angular/core';
import { Reaction } from '../../models/reaction.class';
import { Firestore, doc, updateDoc, getDoc, arrayUnion, DocumentReference } from '@angular/fire/firestore';
import { ChatService } from '../chat/chat.service';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable({
  providedIn: 'root',
})
export class ReactionService {
  firestore: Firestore = inject(Firestore);
  chatService: ChatService = inject(ChatService);
  firebaseService: FirebaseService = inject(FirebaseService);

  showEmojiPicker: boolean = false;
  showEmojiPickerThread: boolean = false;
  showEditMsgEmojiPicker: boolean = false;
  showEditMsgEmojiPickerThread: boolean = false;
  emojiPickerIndex: number = 0;
  emojiPickerIndexThread: number = 0;

  constructor() {}

  currentThreadId: string = '';

  /**
   * Handles adding a predefined reaction to a specific message.
   *
   * @param {string} messageId - The ID of the message to which the reaction is to be added.
   * @param {'thumbUp' | 'thumbDown'} reactionType - The type of the reaction, either 'thumbUp' or 'thumbDown'.
   * @param {string} source - The source of the message ( 'chat' or 'thread').
   */
  handleAddDefinedReaction(messageId: string, reactionType: 'thumbUp' | 'thumbDown', source: string) {
    let reaction: Reaction;
    if (reactionType === 'thumbUp') {
      reaction = { ...this.setReactionThumbUp, messageId: messageId };
    } else {
      reaction = { ...this.setReactionThumbDown, messageId: messageId };
    }
    this.addSpecificReaction(messageId, reaction, source);
  }

  /**
   * Predefined Reaction object for a "Thumb Up" reaction.
   */
  setReactionThumbUp: Reaction = {
    reactionId: '1F44D',
    user: [this.firebaseService.currentUserId],
    messageId: '',
    amount: 1,
    nativeEmoji: '👍',
  };

  /**
   * Predefined Reaction object for a "Thumb Down" reaction.
   */
  setReactionThumbDown: Reaction = {
    reactionId: '1F44E',
    user: [this.firebaseService.currentUserId],
    messageId: '',
    amount: 1,
    nativeEmoji: '👎',
  };

  /**
   * Handles the event when a user clicks on a reaction.
   *
   * @param {Reaction} reaction - The reaction object that was clicked.
   * @param {string} messageId - The ID of the message containing the reaction.
   * @param {string} source - The source of the message (e.g., 'chat' or 'thread').
   * @returns {Promise<void>} A promise that resolves when the reaction is handled.
   * @throws Will throw an error if there is an issue accessing or updating the Firestore document.
   */
  async handleClickOnLastReaction(reaction: Reaction, messageId: string, source: string): Promise<void> {
    const messageDocRef = this.getDocRef(source, messageId);
    const messageDoc = await getDoc(messageDocRef);

    if (messageDoc.exists()) {
      const data = messageDoc.data();
      const userReaction = this.getUserReaction(data, reaction.reactionId);

      if (userReaction) {
        if (userReaction.user.includes(this.firebaseService.currentUserId)) {
          if (userReaction.user.length > 1) {
            // Case 1: The current user has reacted and other users have also reacted
            await this.updateReactionAmount(reaction.reactionId, messageId, 'decrease', source);
          } else {
            // Case 2: The current user is the only user who has reacted
            await this.deleteReaction(reaction.reactionId, messageId, source);
          }
        } else {
          // Case 3: Another user has reacted, but the current user has not
          await this.updateReactionAmount(reaction.reactionId, messageId, 'increase', source);
        }
      } else {
        // Case 3: Another user has reacted, but the current user has not (reaction does not exist for current user)
        await this.updateReactionAmount(reaction.reactionId, messageId, 'increase', source);
      }
    }
  }

  /**
   * Handles the reaction event, either adding a new reaction or updating the amount of an existing reaction.
   *
   * @param {any} event - The event object from the emoji picker.
   * @param {string} messageId - The ID of the message to which the reaction is to be added or updated.
   */
  handleReaction(event: any, messageId: string, source: string) {
    let nativeEmoji = event.emoji.native;
    let reactionId = event.emoji.unified;
    let newReaction: Reaction = {
      reactionId: reactionId,
      user: [this.firebaseService.currentUserId],
      messageId: messageId,
      amount: 1,
      nativeEmoji: nativeEmoji,
    };
    this.addSpecificReaction(messageId, newReaction, source);
    this.showEmojiPicker = false;
    this.showEmojiPickerThread = false;
  }

  /**
   * Adds a new reaction to a message.
   *
   * @param {Reaction} newReaction - The new reaction object to be added.
   * @param {string} messageId - The ID of the message to which the reaction is to be added.
   * @returns {Promise<void>} A promise that resolves when the reaction is successfully added.
   * @throws Will throw an error if there is an issue updating the Firestore document.
   */
  async addSpecificReaction(messageId: string, reaction: Reaction, source: string): Promise<void> {
    try {
      const messageDocRef = this.getDocRef(source, messageId);
      const messageDoc = await getDoc(messageDocRef);

      if (messageDoc.exists()) {
        const data = messageDoc.data();
        if (data && data['reactions']) {
          const existingReaction = data['reactions'].find((r: Reaction) => r.reactionId === reaction.reactionId);

          if (existingReaction) {
            if (!existingReaction.user.includes(this.firebaseService.currentUserId)) {
              await this.updateReactionAmount(reaction.reactionId, messageId, 'increase', source);
            }
          } else {
            await updateDoc(messageDocRef, {
              reactions: arrayUnion(reaction),
            });
          }
        } else {
          await updateDoc(messageDocRef, {
            reactions: [reaction],
          });
        }
      } else {
        throw new Error('Message document does not exist.');
      }
    } catch (error) {
      console.warn('Error updating message text:', error);
      throw error;
    }
  }

  /**
   * Deletes a user's reaction from a message.
   *
   * @param {string} reactionId - The ID of the reaction to delete.
   * @param {string} messageId - The ID of the message containing the reaction.
   * @param {string} source - The source of the message (e.g., 'chat' or 'thread').
   * @returns {Promise<void>} A promise that resolves when the reaction is deleted.
   * @throws Will throw an error if there is an issue accessing or updating the Firestore document.
   */
  async deleteReaction(reactionId: string, messageId: string, source: string): Promise<void> {
    try {
      const messageDocRef = this.getDocRef(source, messageId);
      const messageDoc = await getDoc(messageDocRef);

      if (messageDoc.exists()) {
        const data = messageDoc.data();
        const userReaction = this.getUserReaction(data, reactionId);

        if (userReaction) {
          const updatedReactions = this.updateReactions(data['reactions'], userReaction, reactionId);
          await updateDoc(messageDocRef, { reactions: updatedReactions });
        }
      }
    } catch (error) {
      console.warn('Error deleting reaction:', error);
      throw error;
    }
  }

  /**
   * Retrieves the user's reaction for a given reaction ID.
   *
   * @param {any} data - The data object containing reactions.
   * @param {string} reactionId - The ID of the reaction to retrieve.
   * @returns {Reaction | undefined} The user's reaction if found, otherwise undefined.
   */
  getUserReaction(data: any, reactionId: string): Reaction | undefined {
    return data && data['reactions']
      ? data['reactions'].find(
          (r: Reaction) => r.reactionId === reactionId && r.user.includes(this.firebaseService.currentUserId),
        )
      : undefined;
  }

  /**
   * Updates the reactions array by removing or updating the user's reaction.
   *
   * @param {Reaction[]} reactions - The array of reactions to update.
   * @param {Reaction} userReaction - The user's reaction to update or remove.
   * @param {string} reactionId - The ID of the reaction to update or remove.
   * @returns {Reaction[]} The updated array of reactions.
   */
  updateReactions(reactions: Reaction[], userReaction: Reaction, reactionId: string): Reaction[] {
    if (userReaction.user.length > 1) {
      const updatedUsers = userReaction.user.filter((userId: string) => userId !== this.firebaseService.currentUserId);
      return reactions.map((r: Reaction) =>
        r.reactionId === reactionId ? { ...r, user: updatedUsers, amount: r.amount - 1 } : r,
      );
    }
    return reactions.filter((r: Reaction) => r.reactionId !== reactionId);
  }

  /**
   * Updates the amount of a specific reaction for a message.
   * @param {string} reactionId - The ID of the reaction to update.
   * @param {string} messageId - The ID of the message containing the reaction.
   * @param {'increase' | 'decrease'} operation - The operation to perform on the reaction amount: 'increase' or 'decrease'.
   * @returns {Promise<void>} A promise that resolves when the reaction amount is updated.
   * @throws Will throw an error if there is an issue accessing or updating the Firestore document.
   */
  async updateReactionAmount(
    reactionId: string,
    messageId: string,
    operation: 'increase' | 'decrease',
    source: string,
  ): Promise<void> {
    try {
      const messageDocRef = this.getDocRef(source, messageId);
      const messageDoc = await getDoc(messageDocRef);
      if (messageDoc.exists()) {
        const data = messageDoc.data();
        if (data && data['reactions']) {
          const updatedReactions = data['reactions']
            .map((reaction: Reaction) => {
              if (reaction.reactionId === reactionId) {
                const updatedAmount = operation === 'increase' ? reaction.amount + 1 : reaction.amount - 1;
                if (operation === 'increase' && !reaction.user.includes(this.firebaseService.currentUserId)) {
                  reaction.user.push(this.firebaseService.currentUserId);
                }
                if (operation === 'decrease' && reaction.user.includes(this.firebaseService.currentUserId)) {
                  reaction.user = reaction.user.filter((userId) => userId !== this.firebaseService.currentUserId);
                }
                return {
                  ...reaction,
                  amount: updatedAmount,
                };
              }
              return reaction;
            })
            .filter((reaction: Reaction) => reaction.amount > 0);
          await updateDoc(messageDocRef, { reactions: updatedReactions });
        }
      }
    } catch (error) {
      console.warn(`Error updating reaction amount:`, error);
      throw error;
    }
  }

  /**
   * Retrieves the Firestore document reference for a given message based on the source.
   *
   * @param {string} source - The source of the message ('chat' or 'thread').
   * @param {string} messageId - The ID of the message.
   * @returns {DocumentReference} The Firestore document reference for the specified message.
   * @throws Will throw an error if the source is invalid.
   */
  private getDocRef(source: string, messageId: string): DocumentReference {
    if (source === 'chat') {
      return doc(this.firestore, `${this.chatService.mainCollection}/${this.chatService.docRef}/messages/${messageId}`);
    } else if (source === 'thread') {
      return doc(
        this.firestore,
        `${this.chatService.mainCollection}/${this.chatService.docRef}/messages/${this.currentThreadId}/messageAnswers/${messageId}`,
      );
    } else {
      throw new Error('Invalid source');
    }
  }
}
