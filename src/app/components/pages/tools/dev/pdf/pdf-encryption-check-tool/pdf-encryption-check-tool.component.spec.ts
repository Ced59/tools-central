import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfEncryptionCheckToolComponent } from './pdf-encryption-check-tool.component';

describe('PdfEncryptionCheckToolComponent', () => {
  let component: PdfEncryptionCheckToolComponent;
  let fixture: ComponentFixture<PdfEncryptionCheckToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfEncryptionCheckToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfEncryptionCheckToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
