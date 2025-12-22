import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProportionPartTotalToolComponent } from './proportion-part-total-tool.component';

describe('ProportionPartTotalToolComponent', () => {
  let component: ProportionPartTotalToolComponent;
  let fixture: ComponentFixture<ProportionPartTotalToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProportionPartTotalToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProportionPartTotalToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
