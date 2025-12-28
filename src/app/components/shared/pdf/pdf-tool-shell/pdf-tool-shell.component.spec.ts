import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfToolShellComponent } from './pdf-tool-shell.component';

describe('PdfToolShellComponent', () => {
  let component: PdfToolShellComponent;
  let fixture: ComponentFixture<PdfToolShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfToolShellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfToolShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
