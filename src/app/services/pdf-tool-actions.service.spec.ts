import { TestBed } from '@angular/core/testing';
import { PdfToolActionsService } from './pdf-tool-actions.service';

describe('PdfToolActionsService', () => {
  let service: PdfToolActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfToolActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate correct download filename', () => {
    expect(service.getDownloadFileName('document.pdf', 'fonts')).toBe('document-fonts.json');
    expect(service.getDownloadFileName('test.PDF', 'metadata')).toBe('test-metadata.json');
    expect(service.getDownloadFileName('', 'export')).toBe('pdf-export.json');
  });
});
