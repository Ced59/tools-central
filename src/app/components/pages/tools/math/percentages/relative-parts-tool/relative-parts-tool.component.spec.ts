import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelativePartsToolComponent } from './relative-parts-tool.component';

describe('RelativePartsToolComponent', () => {
  let component: RelativePartsToolComponent;
  let fixture: ComponentFixture<RelativePartsToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelativePartsToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelativePartsToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
