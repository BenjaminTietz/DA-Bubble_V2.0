import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-welcome-screen',
  standalone: true,
  imports: [],
  templateUrl: './welcome-screen.component.html',
  styleUrl: './welcome-screen.component.scss',
})
export class WelcomeScreenComponent implements AfterViewInit {
  @ViewChild('logoContainer') logoContainer!: ElementRef;

  ngAfterViewInit(): void {
    const logoContainer = this.logoContainer.nativeElement;

    logoContainer.addEventListener('animationend', () => {
      logoContainer.style.opacity = '0';
      logoContainer.style.visibility = 'hidden';
      setTimeout(() => {
        logoContainer.style.display = 'none';
      }, 500);
    });
  }
}
