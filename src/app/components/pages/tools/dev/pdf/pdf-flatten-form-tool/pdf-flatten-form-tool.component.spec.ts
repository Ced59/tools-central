import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfFlattenFormToolComponent } from './pdf-flatten-form-tool.component';

describe('PdfFlattenFormToolComponent', () => {
  let component: PdfFlattenFormToolComponent;
  let fixture: ComponentFixture<PdfFlattenFormToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfFlattenFormToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfFlattenFormToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
