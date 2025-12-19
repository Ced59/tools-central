import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadabilityToolComponent } from './readability-tool.component';

describe('ReadabilityToolComponent', () => {
  let component: ReadabilityToolComponent;
  let fixture: ComponentFixture<ReadabilityToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReadabilityToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReadabilityToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
