import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfAnnotationsToJsonToolComponent } from './pdf-annotations-extractor-tool.component';

describe('PdfAnnotationsToJsonToolComponent', () => {
  let component: PdfAnnotationsToJsonToolComponent;
  let fixture: ComponentFixture<PdfAnnotationsToJsonToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfAnnotationsToJsonToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfAnnotationsToJsonToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
