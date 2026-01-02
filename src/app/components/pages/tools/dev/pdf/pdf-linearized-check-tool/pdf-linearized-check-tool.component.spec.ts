import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfLinearizedCheckToolComponent } from './pdf-linearized-check-tool.component';

describe('PdfLinearizedCheckToolComponent', () => {
  let component: PdfLinearizedCheckToolComponent;
  let fixture: ComponentFixture<PdfLinearizedCheckToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfLinearizedCheckToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfLinearizedCheckToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
