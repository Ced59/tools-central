import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparePercentagesToolComponent } from './compare-percentages-tool.component';

describe('ComparePercentagesToolComponent', () => {
  let component: ComparePercentagesToolComponent;
  let fixture: ComponentFixture<ComparePercentagesToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparePercentagesToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComparePercentagesToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
