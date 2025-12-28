import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfOutlineToJsonToolComponent } from './pdf-outline-to-json-tool.component';

describe('PdfOutlineToJsonToolComponent', () => {
  let component: PdfOutlineToJsonToolComponent;
  let fixture: ComponentFixture<PdfOutlineToJsonToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfOutlineToJsonToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfOutlineToJsonToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
