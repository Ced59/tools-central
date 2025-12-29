import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfScanDetectorToolComponent } from './pdf-scan-detector-tool.component';

describe('PdfScanDetectorToolComponent', () => {
  let component: PdfScanDetectorToolComponent;
  let fixture: ComponentFixture<PdfScanDetectorToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfScanDetectorToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfScanDetectorToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
