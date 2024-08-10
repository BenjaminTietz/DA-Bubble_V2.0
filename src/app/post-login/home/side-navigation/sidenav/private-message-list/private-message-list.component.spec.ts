import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateMessageListComponent } from './private-message-list.component';

describe('PrivateMessageListComponent', () => {
  let component: PrivateMessageListComponent;
  let fixture: ComponentFixture<PrivateMessageListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateMessageListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivateMessageListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
