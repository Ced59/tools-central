import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfAnnotationsExtractorToolComponent } from './pdf-annotations-extractor-tool.component';

describe('PdfAnnotationsExtractorToolComponent', () => {
  let component: PdfAnnotationsExtractorToolComponent;
  let fixture: ComponentFixture<PdfAnnotationsExtractorToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfAnnotationsExtractorToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfAnnotationsExtractorToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
