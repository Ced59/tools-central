import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfMetadataToJsonToolComponent } from './pdf-metadata-to-json-tool.component';

describe('PdfMetadataToJsonToolComponent', () => {
  let component: PdfMetadataToJsonToolComponent;
  let fixture: ComponentFixture<PdfMetadataToJsonToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfMetadataToJsonToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfMetadataToJsonToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
