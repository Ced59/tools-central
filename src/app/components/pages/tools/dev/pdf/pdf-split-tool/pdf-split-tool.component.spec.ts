import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfSplitToolComponent } from './pdf-split-tool.component';

describe('PdfSplitToolComponent', () => {
  let component: PdfSplitToolComponent;
  let fixture: ComponentFixture<PdfSplitToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfSplitToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfSplitToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
