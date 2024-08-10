import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreadHistoryComponent } from './thread-history.component';

describe('ThreadHistoryComponent', () => {
  let component: ThreadHistoryComponent;
  let fixture: ComponentFixture<ThreadHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreadHistoryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ThreadHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
