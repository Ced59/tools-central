import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CumulativeVsNaiveToolComponent } from './cumulative-vs-naive-tool.component';

describe('CumulativeVsNaiveToolComponent', () => {
  let component: CumulativeVsNaiveToolComponent;
  let fixture: ComponentFixture<CumulativeVsNaiveToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CumulativeVsNaiveToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CumulativeVsNaiveToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
