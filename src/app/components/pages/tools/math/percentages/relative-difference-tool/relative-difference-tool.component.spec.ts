import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelativeDifferenceToolComponent } from './relative-difference-tool.component';

describe('RelativeDifferenceToolComponent', () => {
  let component: RelativeDifferenceToolComponent;
  let fixture: ComponentFixture<RelativeDifferenceToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelativeDifferenceToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelativeDifferenceToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
