import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import { ActivatedRoute, Params, Router, RouterOutlet } from '@angular/router';
import { HomeComponent } from './post-login/home/home.component';
import { SidenavComponent } from './post-login/home/side-navigation/sidenav/sidenav.component';
import { ChannelListComponent } from './post-login/home/side-navigation/sidenav/channel-list/channel-list.component';
import { PrivateMessageListComponent } from './post-login/home/side-navigation/sidenav/private-message-list/private-message-list.component';
import { NewMessageComponent } from './post-login/new-message/new-message.component';
import { CreateNewChannelComponent } from './post-login/home/channel/create-channel/create-new-channel/create-new-channel.component';
import { ChatHistoryComponent } from './post-login/shared/chat-history/chat-history.component';
import { AuthService } from './services/authentication/auth.service';
import { ThreadComponent } from './post-login/shared/thread/thread.component';
import { ChannelMemberComponent } from './post-login/home/channel/channel-member/channel-member.component';
import { ChannelMemberSelectionComponent } from './post-login/shared/channel-member-selection/channel-member-selection.component';
import { ChannelSelectionComponent } from './post-login/home/channel/channel-selection/channel-selection.component';
import { applyActionCode, getAuth, User } from '@angular/fire/auth';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { WelcomeScreenComponent } from './post-login/home/welcome-screen/welcome-screen.component';
import { CommunicationService } from './services/communication/communication.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NgStyle,
    HomeComponent,
    SidenavComponent,
    NewMessageComponent,
    ChannelListComponent,
    PrivateMessageListComponent,
    CreateNewChannelComponent,
    ChatHistoryComponent,
    ThreadComponent,
    ChannelMemberComponent,
    ChannelMemberSelectionComponent,
    ChannelSelectionComponent,
    WelcomeScreenComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'da-bubble';
  authService = inject(AuthService);
  firestore = inject(Firestore);
  router = inject(Router);
  communicationService = inject(CommunicationService);

  notificate: boolean = false;
  notification: string = '';
  introIsDisabled: boolean = false;

  /**
   * Constructor to initialize the component with the activated route.
   * @param {ActivatedRoute} route - The activated route to access query parameters.
   */
  constructor(private route: ActivatedRoute) {}

  /**
   * Initializes the component, subscribes to user authentication status, and handles query parameters.
   * @returns {void}
   */
  ngOnInit(): void {
    setTimeout(() => {
      this.route.queryParams.subscribe({
        next: (params) => {
          this.authService.user$.subscribe((user) => {
            if (this.router.url.includes('?mode=')) {
              this.handleQueryParams(params);
            } else if (user) {
              this.setUserData(user).then(() => {
                this.handleNavigation(user);
              });
            } else {
              this.handleNoUser();
            }
          });
        },
      });
    }, 1);
    this.checkViewport();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkViewport();
  }

  /**
   * Checks the current viewport dimensions and sets the isMobileViewActive flag.
   */
  checkViewport() {
    const height = window.innerHeight;
    const width = window.innerWidth;
    // Flag for mobile view (height greater than width)
    this.communicationService.isMobileViewActive = height > width;
    // Flag to show rotate device prompt (ratio greater than 1) only for smaller screens
    const ratio = width / height;
    const isSmartPhoneScreen = width < 1024;
    this.communicationService.isRotateDeviceVisible = ratio > 1.3 && isSmartPhoneScreen;
    // Flag for small screen (tablet view)
    const isTabletScreen = width < 1450;
    this.communicationService.isSmallScreenActive = isTabletScreen;
  }

  /**
   * Handles various query parameters related to user actions.
   * @param {Params} params - The URL parameters containing action codes and other relevant information.
   * @returns {void}
   */
  handleQueryParams(params: Params): void {
    this.handleResetPasswordAction(params);
    this.handleVerifyEmailAction(params);
    this.handleVerifyNewEmailAction(params);
    this.handleRecoverEmailAction(params);
  }

  /**
   * Sets the user data in the session storage.
   * @param {User} user - The authenticated user.
   * @returns {void}
   */
  setUserData(user: User): Promise<void> {
    this.setSessionStorage(user);
    const promise = updateDoc(doc(this.firestore, `users/${this.authService.firebaseAuth.currentUser!.uid}`), {
      status: true,
    });
    return promise;
  }

  /**
   * Handles navigation based on user properties.
   * @param {User} user - The authenticated user.
   * @returns {void}
   */
  handleNavigation(user: User): void {
    if (
      user.email != undefined &&
      (!user.photoURL ||
        user.photoURL.includes('googleusercontent') ||
        user.photoURL.includes('assets/img/logos/profile_logo.png'))
    ) {
      this.navToAvatar();
    } else if (!user.emailVerified && user.uid != 'RsgU38XPWoSUezBf8JT5HOJVdja2') {
      this.handleEmailVerification();
    } else {
      this.navToHome(user);
    }
  }

  /**
   * Sets the user data in session storage.
   * @param {User} user - The authenticated user.
   * @returns {void}
   */
  setSessionStorage(user: User): void {
    if (!(sessionStorage.getItem('currentUserId') === user.uid)) {
      sessionStorage.setItem('currentUserId', user.uid);
    }
  }

  /**
   * Navigates to the avatar selection page.
   * @returns {boolean}
   */
  navToAvatar(): boolean {
    this.router.navigateByUrl('/avatar');
    return false;
  }

  /**
   * Handles email verification.
   * @returns {boolean}
   */
  handleEmailVerification(): void {
    this.notificateUser('Bestätigen Sie Ihre E-Mail-Adresse');
    if (this.router.url === '/home') {
      this.navToLogin();
    }
  }

  /**
   * Navigates to the home page if the user is authenticated and the current URL is the root.
   * @returns {boolean}
   */
  navToHome(user?: User): boolean {
    if (this.router.url === '/' && sessionStorage.getItem('currentUserId') === user!.uid) {
      this.router.navigateByUrl('/home');
    }
    return false;
  }

  /**
   * Navigates to the home page if the user is authenticated and the current URL is the root.
   * @returns {boolean}
   */
  navToLogin(): boolean {
    this.router.navigateByUrl('/');
    return false;
  }

  /**
   * Handles the case when there is no authenticated user.
   * @returns {boolean}
   */
  handleNoUser(): boolean {
    this.navToLogin();
    return false;
  }

  /**
   * Handles the reset password action based on the query parameters.
   * @param {Params} params - The query parameters.
   * @returns {boolean}
   */
  handleResetPasswordAction(params: Params): boolean | void {
    if (this.router.url.includes('resetPassword')) {
      this.router.navigate(['/reset-password'], {
        queryParams: params,
      });
      return false;
    }
  }

  /**
   * Handles the verify email action based on the query parameters.
   * @param {Params} params - The query parameters.
   * @returns {boolean}
   */
  handleVerifyEmailAction(params: Params): void {
    if (this.router.url.includes('verifyEmail')) {
      applyActionCode(this.authService.firebaseAuth, params['oobCode']).then(() => {
        this.notificateUser('E-Mail-Adresse bestätigt');
        this.navToLogin();
        setTimeout(() => {
          this.navToHome();
        }, 1000);
      });
    }
  }

  /**
   * Handles the verify new email action on email change based on the query parameters.
   * @param {Params} params - The query parameters.
   * @returns {boolean}
   */
  handleVerifyNewEmailAction(params: Params): void {
    if (this.router.url.includes('verifyAndChangeEmail')) {
      applyActionCode(this.authService.firebaseAuth, params['oobCode']).then(() => {
        this.notificateUser('Neue E-Mail-Adresse bestätigt');
        this.navToLogin();
      });
    }
  }

  /**
   * Handles the recovery of an email adress based on the query parameters.
   * @param {Params} params - The query parameters.
   * @returns {boolean}
   */
  handleRecoverEmailAction(params: Params): void {
    if (this.router.url.includes('recoverEmail')) {
      applyActionCode(this.authService.firebaseAuth, params['oobCode']).then(() => {
        this.notificateUser('E-Mail-Adresse zurückgesetzt');
        this.navToLogin();
      });
    }
  }

  notificateUser(message: string) {
    this.notification = message;
    this.notificate = true;
    setTimeout(() => {
      this.notificate = false;
    }, 3000);
  }
}
