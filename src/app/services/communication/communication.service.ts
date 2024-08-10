import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommunicationService {
  isCurrentUserProfileVisibleSource = new BehaviorSubject<boolean>(false);
  isCurrentUserProfileVisible$ = this.isCurrentUserProfileVisibleSource.asObservable();

  isUserProfileVisibleSource = new BehaviorSubject<boolean>(false);
  isUserProfileVisible$ = this.isUserProfileVisibleSource.asObservable();

  isChannelDetailsVisibleSource = new BehaviorSubject<boolean>(false);
  isChannelDetailsVisible$ = this.isChannelDetailsVisibleSource.asObservable();

  isAddMembersToChannelVisibleSource = new BehaviorSubject<boolean>(false);
  isAddMembersToChannelVisible$ = this.isAddMembersToChannelVisibleSource.asObservable();

  isChannelMemberVisibleSource = new BehaviorSubject<boolean>(false);
  isChannelMemberVisible$ = this.isChannelMemberVisibleSource.asObservable();

  //thread variables
  isThreadVisible: boolean = false;
  //router-outelt variables
  isRouterOutletVisible: boolean = false;

  isHeaderInputVisible: boolean = false;
  showChannels = false;
  showUsers = false;

  // user profile variabels
  userProfileId: string = ''; // is getting used to store userId of the user whose profile is being viewed
  // edit msg menu
  isMsgMenuVisible: boolean = false;
  // edit msg menu Thread
  isMsgMenuThreadVisible: boolean = false;
  // delete msg dialog
  isDeleteMsgDialogVisible: boolean = false;
  // delete msg dialog thread
  isDeleteThreadMsgDialogVisible: boolean = false;
  // flag for tag container displaying all Users in new-message comp
  showAllUsers: boolean = false;
  // is getting used to store channelRef of  the channel which got created in create-channel comp
  newChanId = '';

  //sidenav variables
  isSidenavVisible: boolean = true;
  isSidenavToggled: boolean = false;
  isSidenavAnimationComplete: boolean = false;

  // welcome screen variables
  isWelcomeScreenVisible: boolean = true;

  // mobile view variables
  isMobileViewActive: boolean = false; // main flag to check if mobile view is active

  isRotateDeviceVisible: boolean = false; // flag to show rotate your device message
  isSmallScreenActive: boolean = false; // flag to indicate if the screen is small (mobile view < 1200px for tablets)

  isMobileUserMenuVisible: boolean = false;

  constructor() {}

  toggleThreadVisibility() {
    this.isThreadVisible = !this.isThreadVisible;
  }

  toggleCurrentUserProfileVisibility(visible: boolean) {
    this.isCurrentUserProfileVisibleSource.next(visible);
  }

  toggleUserProfileVisibility(visible: boolean) {
    this.isUserProfileVisibleSource.next(visible);
  }

  toggleChannelDetailsVisibility(visible: boolean) {
    this.isChannelDetailsVisibleSource.next(visible);
  }

  toggleAddMembersToChannelVisibility(visible: boolean) {
    this.isAddMembersToChannelVisibleSource.next(visible);
  }

  toggleChannelMemberVisibility(visible: boolean) {
    this.isChannelMemberVisibleSource.next(visible);
  }

  handleClickOnUser(memberId: string) {
    this.toggleUserProfileVisibility(true);
    this.userProfileId = memberId;
  }

  handleClickCurrentUser(visible: boolean) {
    this.toggleCurrentUserProfileVisibility(visible);
  }

  // mobile view functions
  toggleMobileUserMenu() {
    this.isMobileUserMenuVisible = !this.isMobileUserMenuVisible;
  }

  //sidenav functions
  /**
   * Toggles the visibility of the sidenav and sets the toggled flag.
   */
  toggleSidenav(): void {
    if (this.isSidenavVisible) {
      this.isSidenavAnimationComplete = false;
      this.isSidenavToggled = true;
      this.isSidenavVisible = false;
      setTimeout(() => {
        this.isSidenavAnimationComplete = true;
      }, 175);
    } else {
      this.isSidenavAnimationComplete = false;
      this.isSidenavVisible = true;
      setTimeout(() => {
        this.isSidenavAnimationComplete = true;
      }, 175);
    }
  }

  toggleSideNavMobile() {
    this.isSidenavVisible = !this.isSidenavVisible;
    this.isThreadVisible = !this.isThreadVisible;
    this.isRouterOutletVisible = !this.isRouterOutletVisible;
  }

  closeMobileMenuPopupOverlay(menu: string) {
    if (menu === 'mobileUserMenu') {
      const menuContent = document.querySelector('.mobile-user-menu-content');
      if (menuContent) {
        menuContent.classList.add('hide');
        setTimeout(() => {
          this.isMobileUserMenuVisible = false;
          menuContent.classList.remove('hide');
        }, 175);
      }
    }
  }
}
