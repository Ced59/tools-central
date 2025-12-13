import { TestBed } from '@angular/core/testing';

import { SeoLinksService } from './seo-links.service';

describe('SeoLinksService', () => {
  let service: SeoLinksService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeoLinksService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
