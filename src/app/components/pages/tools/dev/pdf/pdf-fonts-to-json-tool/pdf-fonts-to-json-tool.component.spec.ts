import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfFontsToJsonToolComponent } from './pdf-fonts-to-json-tool.component';

describe('PdfFontsToJsonToolComponent', () => {
  let component: PdfFontsToJsonToolComponent;
  let fixture: ComponentFixture<PdfFontsToJsonToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfFontsToJsonToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfFontsToJsonToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
