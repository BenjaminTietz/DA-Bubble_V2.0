import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateNoteComponent } from './private-note.component';

describe('PrivateNoteComponent', () => {
  let component: PrivateNoteComponent;
  let fixture: ComponentFixture<PrivateNoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateNoteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivateNoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
