import { TestBed } from '@angular/core/testing';

import { ToolRegistryService } from './tool-registry.service';

describe('ToolRegistryService', () => {
  let service: ToolRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToolRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
