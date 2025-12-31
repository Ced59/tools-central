import { TestBed } from '@angular/core/testing';

import { TollEditorialService } from './toll-editorial.service';

describe('TollEditorialService', () => {
  let service: TollEditorialService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TollEditorialService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
