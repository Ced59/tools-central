import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfXrefToJsonToolComponent } from './pdf-xref-to-json-tool.component';

describe('PdfXrefToJsonToolComponent', () => {
  let component: PdfXrefToJsonToolComponent;
  let fixture: ComponentFixture<PdfXrefToJsonToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfXrefToJsonToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfXrefToJsonToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
