import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfPageContentOpsToJsonToolComponent } from './pdf-page-content-ops-to-json-tool.component';

describe('PdfPageContentOpsToJsonToolComponent', () => {
  let component: PdfPageContentOpsToJsonToolComponent;
  let fixture: ComponentFixture<PdfPageContentOpsToJsonToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfPageContentOpsToJsonToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfPageContentOpsToJsonToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
