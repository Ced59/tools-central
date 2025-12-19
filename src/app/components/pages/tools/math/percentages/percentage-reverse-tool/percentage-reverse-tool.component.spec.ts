import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageReverseToolComponent } from './percentage-reverse-tool.component';

describe('PercentageReverseToolComponent', () => {
  let component: PercentageReverseToolComponent;
  let fixture: ComponentFixture<PercentageReverseToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageReverseToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageReverseToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
