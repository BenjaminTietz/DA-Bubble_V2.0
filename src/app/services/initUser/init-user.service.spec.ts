import { TestBed } from '@angular/core/testing';

import { InitUserService } from './init-user.service';

describe('InitUserService', () => {
  let service: InitUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InitUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
