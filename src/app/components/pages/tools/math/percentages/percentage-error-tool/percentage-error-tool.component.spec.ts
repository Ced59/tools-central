import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageErrorToolComponent } from './percentage-error-tool.component';

describe('PercentageErrorToolComponent', () => {
  let component: PercentageErrorToolComponent;
  let fixture: ComponentFixture<PercentageErrorToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageErrorToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageErrorToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
