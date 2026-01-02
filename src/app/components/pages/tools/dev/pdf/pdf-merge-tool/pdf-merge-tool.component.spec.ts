import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfMergeToolComponent } from './pdf-merge-tool.component';

describe('PdfMergeToolComponent', () => {
  let component: PdfMergeToolComponent;
  let fixture: ComponentFixture<PdfMergeToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfMergeToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfMergeToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
