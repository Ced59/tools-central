import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageExercisesGeneratorToolComponent } from './percentage-exercises-generator-tool.component';

describe('PercentageExercisesGeneratorToolComponent', () => {
  let component: PercentageExercisesGeneratorToolComponent;
  let fixture: ComponentFixture<PercentageExercisesGeneratorToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageExercisesGeneratorToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageExercisesGeneratorToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
