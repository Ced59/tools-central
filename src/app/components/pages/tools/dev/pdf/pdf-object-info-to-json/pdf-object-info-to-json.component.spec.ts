import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfObjectInfoToJsonComponent } from './pdf-object-info-to-json.component';

describe('PdfObjectInfoToJsonComponent', () => {
  let component: PdfObjectInfoToJsonComponent;
  let fixture: ComponentFixture<PdfObjectInfoToJsonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfObjectInfoToJsonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfObjectInfoToJsonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
