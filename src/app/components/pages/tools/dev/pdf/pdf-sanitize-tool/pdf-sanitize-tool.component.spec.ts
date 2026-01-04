import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfSanitizeToolComponent } from './pdf-sanitize-tool.component';

describe('PdfSanitizeToolComponent', () => {
  let component: PdfSanitizeToolComponent;
  let fixture: ComponentFixture<PdfSanitizeToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfSanitizeToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfSanitizeToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
