import { TestBed } from '@angular/core/testing';

import { ToolEditorialService } from './tool-editorial.service';

describe('ToolEditorialService', () => {
  let service: ToolEditorialService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToolEditorialService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
