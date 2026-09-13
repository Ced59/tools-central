import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfSanitizeToolComponent } from './pdf-sanitize-tool.component';

describe('PdfSanitizeToolComponent', () => {
  let component: PdfSanitizeToolComponent;
  let fixture: ComponentFixture<PdfSanitizeToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfSanitizeToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfSanitizeToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('stores the selected file without reading or uploading it', () => {
    const file = new File(['%PDF-1.7'], 'private.pdf', { type: 'application/pdf' });

    component.onFileSelected(file);

    expect(component.sourceFile()).toBe(file);
    expect(component.sourceInfo()).toEqual({
      name: 'private.pdf',
      bytes: file.size,
      mime: 'application/pdf',
    });
  });

  it('requires a PDF before starting the worker', async () => {
    await component.sanitizeNow();

    expect(component.status()).toBe('idle');
    expect(component.tipMessage()).toContain('PDF');
  });
});
