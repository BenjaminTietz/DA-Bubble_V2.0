import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelMemberSelectionComponent } from './channel-member-selection.component';

describe('ChannelMemberSelectionComponent', () => {
  let component: ChannelMemberSelectionComponent;
  let fixture: ComponentFixture<ChannelMemberSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelMemberSelectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChannelMemberSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
