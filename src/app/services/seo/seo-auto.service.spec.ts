import { TestBed } from '@angular/core/testing';

import { SeoAutoService } from './seo-auto.service';

describe('SeoAutoService', () => {
  let service: SeoAutoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeoAutoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
