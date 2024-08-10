import { Routes } from '@angular/router';

// post-login components
import { HomeComponent } from './post-login/home/home.component';
import { NewMessageComponent } from './post-login/new-message/new-message.component';
import { ChannelComponent } from '../app/post-login/home/channel/channel.component';
import { PrivateMessageComponent } from './post-login/private-message/private-message.component';
import { PrivateNoteComponent } from './post-login/private-note/private-note.component';
import { WelcomeScreenComponent } from './post-login/home/welcome-screen/welcome-screen.component';

// pre-login components
import { LandingComponent } from './pre-login/landing/landing.component';
import { SignupComponent } from './pre-login/landing/signup/signup.component';
import { PasswordResetRequestComponent } from './pre-login/landing/password-reset-request/password-reset-request.component';
import { SelectAvatarComponent } from './pre-login/landing/select-avatar/select-avatar.component';
import { LoginComponent } from './pre-login/landing/login/login.component';
import { ResetPasswordComponent } from './pre-login/landing/reset-password/reset-password.component';
import { PrivacyPolicyComponent } from './pre-login/privacy-policy/privacy-policy.component';
import { ImprintComponent } from './pre-login/imprint/imprint.component';

export const routes: Routes = [
	// pre-login components
	{
		path: '',
		component: LandingComponent,
		children: [
			{ path: '', component: LoginComponent },
			{ path: 'signup', component: SignupComponent },
			{ path: 'avatar', component: SelectAvatarComponent },
			{
				path: 'password-reset-request',
				component: PasswordResetRequestComponent,
			},
			{ path: 'reset-password', component: ResetPasswordComponent },
		],
	},

  // post-login components
  {
    path: 'home',
    component: HomeComponent,
    children: [
      { path: 'channels/:id', component: ChannelComponent },
      { path: 'privateChats/:id', component: PrivateMessageComponent },
      { path: 'new-message', component: NewMessageComponent },
      { path: 'privateNotes/:id', component: PrivateNoteComponent },
    ],
  },

  { path: 'imprint', component: ImprintComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
];
