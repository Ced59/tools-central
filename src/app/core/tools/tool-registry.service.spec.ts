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

  it('masque les variantes disponibles non relues sans retirer les outils planifiés', () => {
    const seoTools = service.listToolsByGroup('dev', 'seo');
    const pdfTools = service.listToolsByGroup('dev', 'pdf');

    expect(seoTools.some(tool => tool.id === 'software-application-schema-builder')).toBe(false);
    expect(pdfTools.some(tool => !tool.available)).toBe(true);
  });
});
