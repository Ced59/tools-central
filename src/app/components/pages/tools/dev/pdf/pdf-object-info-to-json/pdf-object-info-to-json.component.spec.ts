import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfObjectInfoToJsonToolComponent } from './pdf-object-info-to-json.component';

describe('PdfObjectInfoToJsonToolComponent', () => {
  let component: PdfObjectInfoToJsonToolComponent;
  let fixture: ComponentFixture<PdfObjectInfoToJsonToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfObjectInfoToJsonToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfObjectInfoToJsonToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
