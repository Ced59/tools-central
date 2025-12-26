import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProportionalTableCompleteToolComponent } from './proportional-table-complete-tool.component';

describe('ProportionalTableCompleteToolComponent', () => {
  let component: ProportionalTableCompleteToolComponent;
  let fixture: ComponentFixture<ProportionalTableCompleteToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProportionalTableCompleteToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProportionalTableCompleteToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
