import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfAttachmentsExtractorToolComponent } from './pdf-attachments-extractor-tool.component';

describe('PdfAttachmentsExtractorToolComponent', () => {
  let component: PdfAttachmentsExtractorToolComponent;
  let fixture: ComponentFixture<PdfAttachmentsExtractorToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfAttachmentsExtractorToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfAttachmentsExtractorToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
