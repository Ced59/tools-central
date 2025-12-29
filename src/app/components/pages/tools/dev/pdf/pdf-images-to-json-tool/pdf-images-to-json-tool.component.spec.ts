import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfImagesToJsonToolComponent } from './pdf-images-to-json-tool.component';

describe('PdfImagesToJsonToolComponent', () => {
  let component: PdfImagesToJsonToolComponent;
  let fixture: ComponentFixture<PdfImagesToJsonToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfImagesToJsonToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfImagesToJsonToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
