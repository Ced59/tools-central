import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfFormFieldsToJsonToolComponent } from './pdf-form-fields-to-json-tool.component';

describe('PdfFormFieldsToJsonToolComponent', () => {
  let component: PdfFormFieldsToJsonToolComponent;
  let fixture: ComponentFixture<PdfFormFieldsToJsonToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfFormFieldsToJsonToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfFormFieldsToJsonToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
