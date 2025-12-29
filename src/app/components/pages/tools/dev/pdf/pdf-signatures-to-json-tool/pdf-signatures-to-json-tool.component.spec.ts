import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfSignaturesToJsonToolComponent } from './pdf-signatures-to-json-tool.component';

describe('PdfSignaturesToJsonToolComponent', () => {
  let component: PdfSignaturesToJsonToolComponent;
  let fixture: ComponentFixture<PdfSignaturesToJsonToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfSignaturesToJsonToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfSignaturesToJsonToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
