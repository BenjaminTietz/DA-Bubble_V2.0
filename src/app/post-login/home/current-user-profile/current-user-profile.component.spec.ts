import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentUserProfileComponent } from './current-user-profile.component';

describe('CurrentUserProfileComponent', () => {
  let component: CurrentUserProfileComponent;
  let fixture: ComponentFixture<CurrentUserProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentUserProfileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrentUserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
