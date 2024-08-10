import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelMemberComponent } from './channel-member.component';

describe('ChannelMemberComponent', () => {
  let component: ChannelMemberComponent;
  let fixture: ComponentFixture<ChannelMemberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelMemberComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChannelMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
