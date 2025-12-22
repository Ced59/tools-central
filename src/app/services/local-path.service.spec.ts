import { TestBed } from '@angular/core/testing';

import { LocalPathService } from './local-path.service';

describe('LocalPathService', () => {
  let service: LocalPathService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalPathService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
