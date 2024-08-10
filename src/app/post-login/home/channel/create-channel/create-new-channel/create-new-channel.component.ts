import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Firestore, collection, addDoc, doc, updateDoc, getDoc } from '@angular/fire/firestore';
import { Channel } from '../../../../../models/channel.class';
import { FirebaseService } from '../../../../../services/firebase/firebase.service';
import { SearchService } from '../../../../../services/search/search.service';
import { ChannelMemberSelectionComponent } from '../../../../shared/channel-member-selection/channel-member-selection.component';
import { ChannelSelectionComponent } from '../../channel-selection/channel-selection.component';
import { ChatService } from '../../../../../services/chat/chat.service';
import { Router } from '@angular/router';
import { CommunicationService } from '../../../../../services/communication/communication.service';
@Component({
  selector: 'app-create-new-channel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ChannelMemberSelectionComponent, ChannelSelectionComponent],
  templateUrl: './create-new-channel.component.html',
  styleUrl: './create-new-channel.component.scss',
})
export class CreateNewChannelComponent {
  firestore: Firestore = inject(Firestore);
  firebaseService = inject(FirebaseService);
  searchService = inject(SearchService);
  chatService = inject(ChatService);
  communicationService = inject(CommunicationService);

  channelData: FormGroup;
  channel = new Channel();
  isCreateChannelFormVisible: boolean = true;
  isAddMemberVisibleForm: boolean = false;
  showChannelSerach: boolean = false;
  showUserSearch: boolean = false;
  chanNameExists: boolean = false;
  errorMsgChanExists: string = 'Channel Name existiert bereits!';
  errorMsgChanNameInvalid: string = 'Bitte geben Sie einen Channel-Namen mit max 10 Zeichen ein.';
  searchText: FormGroup;
  selectedMembers: string[] = [];

  @Input() isCreateChannelVisible: boolean = false;
  @Output() createChannelVisibilityChange = new EventEmitter<boolean>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.channelData = this.fb.group({
      channelName: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(10)]),
      channelDescription: new FormControl(''),
    });
    this.searchText = this.fb.group({
      searchText: [''],
    });
    this.searchService.selectedUser = [];
    this.searchService.selectedChannel = '';
  }

  ngOnDestroy(): void {
    this.searchService.memberSearchActive = false;
    this.searchService.selectedUser = [];
  }

  /**
   * Creates a new channel based on the data in `channelData` form group.
   * If form is valid, it adds a new channel document to Firestore and updates the document with its ID.
   * Logs errors if adding or updating fails.
   * to-do use setChannel method from firebase service & shorten the method
   */
  async createChannel() {
    if (this.channelData.valid) {
      const channelValues = this.channelData.value;

      try {
        const ChanNameExists = await this.firebaseService.checkChannelNameExists(channelValues.channelName);

        if (ChanNameExists) {
          this.chanNameExists = true;
          return;
        }

        let newChannel: Channel = {
          chanId: '',
          name: channelValues.channelName,
          description: channelValues.channelDescription,
          members: [this.firebaseService.currentUserId],
          createdAt: this.chatService.convertDate(),
          createdBy: this.firebaseService.currentUserId,
        };

        const docRef = await this.addChannel(newChannel);
        await this.updateChannelId(docRef);
        await this.firebaseService.updateUserChannelsArray([this.firebaseService.currentUserId], docRef.id);
        this.channelData.reset();
        this.toggleCreateChannelFormVisibility();
        this.toggleAddMemberFormVisibility();
      } catch (e) {
        console.error('Error adding/updating document: ', e);
      }
    }
  }
  /**
   * Adds a new channel document to Firestore.
   * @param channelData The channel data to be added.
   * @returns The document reference after the document is added.
   * @throws Error if there is an issue adding the document.
   */
  async addChannel(channelData: Channel): Promise<any> {
    try {
      const docRef = await addDoc(collection(this.firestore, 'channels'), channelData);
      return docRef;
    } catch (e) {
      console.error('Error adding document: ', e);
      throw e;
    }
  }
  /**
   * Updates the `id` field of a channel document in Firestore.
   * @param docRef The document reference object containing the ID of the document to update.
   * @throws Error if there is an issue updating the document.
   */

  async updateChannelId(docRef: any): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, 'channels', docRef.id), {
        chanId: docRef.id,
      });
      this.communicationService.newChanId = docRef.id;
    } catch (e) {
      console.error('Error updating document: ', e);
      throw e;
    }
  }

  /**
   * Toggles the visibility of the search input fields for channels or users based on the provided name.
   *
   * This function will toggle the visibility of the search input for channels or users. It will also
   * reset the search text and clear the selected user or channel depending on which search input is being toggled.
   *
   * @param {string} name - The type of search input to toggle. It can be either 'channel' or 'user'.
   * @returns {void}
   */
  toggleSearchInput(name: string) {
    if (name === 'channel') {
      this.showChannelSerach = !this.showChannelSerach;
      this.showUserSearch = false;
      this.searchService.selectedUser = [];
      this.searchText.reset();
    } else if (name === 'user') {
      this.showUserSearch = !this.showUserSearch;
      this.showChannelSerach = false;
      this.searchText.reset();
    }
  }

  /**
   * Handles adding a member to a channel.
   *
   * This function performs the following steps:
   * 1. Checks if a channel is selected.
   * 2. Extracts member IDs from the selected channel and updates the channel members array in Firestore.
   * 3. Updates the user channels array in Firestore for the selected user.
   * 4. Emits an event to change channel visibility and navigates to the new channel.
   * 5. If no channel is selected but a user is selected, it directly updates the Firestore arrays and navigates to the new channel.
   *
   * @returns {Promise<void>} A promise that resolves when the member has been successfully added and the navigation is complete.
   * @throws Will throw an error if any of the Firestore operations or navigation fails.
   */
  async handleAddMember() {
    if (this.searchService.selectedChannel.length > 0) {
      await this.extractMemberIdsFromChannel(this.searchService.selectedChannel);
      await this.firebaseService.updateChannelMembersArray(this.communicationService.newChanId, this.selectedMembers);
      await this.firebaseService.updateUserChannelsArray(
        this.searchService.selectedUser,
        this.communicationService.newChanId,
      );
      this.createChannelVisibilityChange.emit(false);
      this.router.navigate([`/home/channels/${this.communicationService.newChanId}`]);
    }
    if (this.searchService.selectedUser.length > 0) {
      await this.firebaseService.updateChannelMembersArray(
        this.communicationService.newChanId,
        this.searchService.selectedUser,
      );
      await this.firebaseService.updateUserChannelsArray(
        this.searchService.selectedUser,
        this.communicationService.newChanId,
      );
      this.createChannelVisibilityChange.emit(false);
      this.router.navigate([`/home/channels/${this.communicationService.newChanId}`]);
    }
  }

  /**
   * Removes the selected channel ID from the search service.
   */
  removeSelectedChannel() {
    this.searchService.selectedChannel = '';
  }

  /**
   * Extracts all member IDs from the members field of a specific channel document
   * and pushes them into the selectedMembers array in SearchService.
   * @param {string} chanId - The ID of the channel document.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async extractMemberIdsFromChannel(chanId: string): Promise<void> {
    const channelDocRef = doc(this.firestore, `channels/${chanId}`);
    const channelDocSnapshot = await getDoc(channelDocRef);

    if (channelDocSnapshot.exists()) {
      const channelData = channelDocSnapshot.data();
      if (channelData && channelData['members'] && Array.isArray(channelData['members'])) {
        const memberIds = channelData['members'] as string[];
        this.selectedMembers = Array.from(new Set([...this.selectedMembers, ...memberIds]));
      }
    } else {
      console.error(`Channel with ID ${chanId} does not exist.`);
    }
  }

  // Toggles the visibility of the create channel component
  toggleCreateChannelVisibility() {
    this.isCreateChannelVisible = !this.isCreateChannelVisible;
    this.createChannelVisibilityChange.emit(this.isCreateChannelVisible);
  }
  // Toggles the visibility of the create channel form
  toggleCreateChannelFormVisibility() {
    this.isCreateChannelFormVisible = !this.isCreateChannelFormVisible;
  }
  // Toggles the visibility of the add member form
  toggleAddMemberFormVisibility() {
    this.isAddMemberVisibleForm = !this.isAddMemberVisibleForm;
    if (this.isAddMemberVisibleForm === false) {
      this.toggleCreateChannelVisibility();
    }
  }
}
