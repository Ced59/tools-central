import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfFontEmbeddingCheckToolComponent } from './pdf-font-embedding-check-tool.component';

describe('PdfFontEmbeddingCheckToolComponent', () => {
  let component: PdfFontEmbeddingCheckToolComponent;
  let fixture: ComponentFixture<PdfFontEmbeddingCheckToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfFontEmbeddingCheckToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfFontEmbeddingCheckToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
