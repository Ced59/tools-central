import { TestBed } from '@angular/core/testing';

import { LocalePathService } from './locale-path.service';

describe('LocalePathService', () => {
  let service: LocalePathService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalePathService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
