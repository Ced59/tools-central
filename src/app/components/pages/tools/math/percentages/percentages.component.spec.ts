import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentagesComponent } from './percentages.component';

describe('PercentagesComponent', () => {
  let component: PercentagesComponent;
  let fixture: ComponentFixture<PercentagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
