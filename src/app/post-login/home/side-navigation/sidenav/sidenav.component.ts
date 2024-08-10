import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ChannelListComponent } from './channel-list/channel-list.component';
import { PrivateMessageListComponent } from './private-message-list/private-message-list.component';
import { PrivateMessageComponent } from '../../../private-message/private-message.component';
import { CommunicationService } from '../../../../services/communication/communication.service';
import { HeaderComponent } from '../../header/header.component';

/**
 * The SidenavComponent provides navigation functionality for the sidebar.
 */

@Component({
  selector: 'app-sidenav',
  standalone: true,
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  imports: [
    ChannelListComponent,
    HeaderComponent,
    PrivateMessageListComponent,
    PrivateMessageComponent,
    CommonModule,
    RouterModule,
  ],
})
export class SidenavComponent {
  @Output() messageEvent = new EventEmitter<object>();

  @Input() isCreateChannelVisible: boolean = false;
  @Output() createChannelVisibilityChange = new EventEmitter<boolean>();

  communicationService = inject(CommunicationService);

  constructor(private router: Router) {}

  chanListExpanded: boolean = false;
  privateMsgListExpanded: boolean = false;

  /**
   * Toggles the expansion state of the channel list and updates the icons.
   */
  toggleChannels() {
    this.chanListExpanded = !this.chanListExpanded;
  }

  /**
   * Toggles the expansion state of the private message list and updates the icons.
   */
  togglePrivateMessages() {
    this.privateMsgListExpanded = !this.privateMsgListExpanded;
  }

  /**
   * Toggles the visibility of the create channel component.
   * Emits an event to notify listeners about the visibility change.
   */
  toggleCreateChannelVisibility() {
    this.isCreateChannelVisible = !this.isCreateChannelVisible;
    this.createChannelVisibilityChange.emit(this.isCreateChannelVisible);
  }

  handleOpenNewMessage() {
    this.router.navigate(['home/new-message']);
    this.communicationService.isWelcomeScreenVisible = false;
    this.communicationService.isRouterOutletVisible = true;
  }
}
