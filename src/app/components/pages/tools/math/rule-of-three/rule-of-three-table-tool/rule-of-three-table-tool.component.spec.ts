import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleOfThreeTableToolComponent } from './rule-of-three-table-tool.component';

describe('RuleOfThreeTableToolComponent', () => {
  let component: RuleOfThreeTableToolComponent;
  let fixture: ComponentFixture<RuleOfThreeTableToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuleOfThreeTableToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RuleOfThreeTableToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
