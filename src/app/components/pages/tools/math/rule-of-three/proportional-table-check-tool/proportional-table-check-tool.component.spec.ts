import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProportionalTableCheckToolComponent } from './proportional-table-check-tool.component';

describe('ProportionalTableCheckToolComponent', () => {
  let component: ProportionalTableCheckToolComponent;
  let fixture: ComponentFixture<ProportionalTableCheckToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProportionalTableCheckToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProportionalTableCheckToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
