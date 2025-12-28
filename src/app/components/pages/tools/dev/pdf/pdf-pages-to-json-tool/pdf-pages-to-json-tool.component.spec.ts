import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfPagesToJsonToolComponent } from './pdf-pages-to-json-tool.component';

describe('PdfPagesToJsonToolComponent', () => {
  let component: PdfPagesToJsonToolComponent;
  let fixture: ComponentFixture<PdfPagesToJsonToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfPagesToJsonToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfPagesToJsonToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
