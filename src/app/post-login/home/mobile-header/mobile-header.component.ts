import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FirebaseService } from '../../../services/firebase/firebase.service';
import { CommunicationService } from '../../../services/communication/communication.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mobile-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mobile-header.component.html',
  styleUrl: './mobile-header.component.scss',
})
export class MobileHeaderComponent {
  firebaseService = inject(FirebaseService);
  communicationService = inject(CommunicationService);

  constructor(private router: Router) {}

  handleBackButtonClick() {
    this.router.navigate(['home/']);
    this.communicationService.isRouterOutletVisible = false;
    this.communicationService.isThreadVisible = false;
    this.communicationService.isSidenavVisible = true;
  }
}
