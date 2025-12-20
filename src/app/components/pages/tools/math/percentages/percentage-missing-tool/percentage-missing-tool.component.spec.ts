import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageMissingToolComponent } from './percentage-missing-tool.component';

describe('PercentageMissingToolComponent', () => {
  let component: PercentageMissingToolComponent;
  let fixture: ComponentFixture<PercentageMissingToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageMissingToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageMissingToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
