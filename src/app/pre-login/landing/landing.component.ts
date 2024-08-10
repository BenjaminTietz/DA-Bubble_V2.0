import { Component, inject } from '@angular/core';
import { LandingHeaderComponent } from './landing-header/landing-header.component';
import { LandingFooterComponent } from './landing-footer/landing-footer.component';
import { CommonModule, NgIf } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/authentication/auth.service';
import { CommunicationService } from '../../services/communication/communication.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [LandingHeaderComponent, LandingFooterComponent, RouterOutlet, NgIf, RouterLink, CommonModule],
  animations: [],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  authService = inject(AuthService);
  router = inject(Router);
  communicationService = inject(CommunicationService);
}
