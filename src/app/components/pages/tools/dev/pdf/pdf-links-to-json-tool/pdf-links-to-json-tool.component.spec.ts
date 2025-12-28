import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfLinksToJsonToolComponent } from './pdf-links-to-json-tool.component';

describe('PdfLinksToJsonToolComponent', () => {
  let component: PdfLinksToJsonToolComponent;
  let fixture: ComponentFixture<PdfLinksToJsonToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfLinksToJsonToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfLinksToJsonToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
