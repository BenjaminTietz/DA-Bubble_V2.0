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

  /**
   * Toggles the visibility of a thread.
   */
  toggleThreadVisibility() {
    this.isThreadVisible = !this.isThreadVisible;
  }

  /**
   * Toggles the visibility of the current user's profile.
   *
   * @param {boolean} visible - A boolean indicating whether the profile should be visible.
   */
  toggleCurrentUserProfileVisibility(visible: boolean) {
    this.isCurrentUserProfileVisibleSource.next(visible);
  }

  /**
   * Toggles the visibility of a user profile.
   *
   * @param {boolean} visible - A boolean indicating whether the user profile should be visible.
   */
  toggleUserProfileVisibility(visible: boolean) {
    this.isUserProfileVisibleSource.next(visible);
  }

  /**
   * Toggles the visibility of the channel details.
   *
   * @param {boolean} visible - A boolean indicating whether the channel details should be visible.
   */
  toggleChannelDetailsVisibility(visible: boolean) {
    this.isChannelDetailsVisibleSource.next(visible);
  }

  /**
   * Toggles the visibility of the "Add Members to Channel" modal.
   *
   * @param {boolean} visible - A boolean indicating whether the modal should be visible.
   */
  toggleAddMembersToChannelVisibility(visible: boolean) {
    this.isAddMembersToChannelVisibleSource.next(visible);
  }

  /**
   * Toggles the visibility of the channel members list.
   *
   * @param {boolean} visible - A boolean indicating whether the members list should be visible.
   */
  toggleChannelMemberVisibility(visible: boolean) {
    this.isChannelMemberVisibleSource.next(visible);
  }

  /**
   * Handles the click event on a user, showing the user's profile.
   *
   * @param {string} memberId - The ID of the user whose profile should be displayed.
   */
  handleClickOnUser(memberId: string) {
    this.toggleUserProfileVisibility(true);
    this.userProfileId = memberId;
  }

  /**
   * Handles the click event on the current user, toggling the visibility of the user's profile.
   *
   * @param {boolean} visible - A boolean indicating whether the current user's profile should be visible.
   */
  handleClickCurrentUser(visible: boolean) {
    this.toggleCurrentUserProfileVisibility(visible);
  }

  /**
   * Toggles the visibility of the mobile user menu.
   *
   * This method switches the visibility state of the mobile user menu
   * between visible and hidden.
   */

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

  /**
   * Toggles the visibility of the side navigation, thread, and router outlet on mobile devices.
   *
   * This method switches the visibility state of the side navigation, thread,
   * and router outlet between visible and hidden.
   */
  toggleSideNavMobile() {
    this.isSidenavVisible = !this.isSidenavVisible;
    this.isThreadVisible = !this.isThreadVisible;
    this.isRouterOutletVisible = !this.isRouterOutletVisible;
  }

  /**
   * Closes the mobile menu popup overlay with a specific animation.
   *
   * This method hides the mobile user menu by adding a 'hide' class, and after a
   * delay, sets the visibility to false and removes the 'hide' class for future use.
   *
   * @param {string} menu - The name of the menu to be closed. If the menu is 'mobileUserMenu',
   *                        the corresponding menu content will be hidden with an animation.
   */
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
