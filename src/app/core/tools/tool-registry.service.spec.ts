import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ToolRegistryService } from './tool-registry.service';

describe('ToolRegistryService', () => {
  let service: ToolRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'en' }] });
    service = TestBed.inject(ToolRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('ne charge pas une variante dont la locale n’est pas relue', async () => {
    const component = await service.loadToolComponent({
      category: 'dev',
      group: 'seo',
      tool: 'software-application-schema-builder',
    });

    expect(component).toBeNull();
  });
});
