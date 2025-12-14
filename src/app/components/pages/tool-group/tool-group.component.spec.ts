import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolGroupComponent } from './tool-group.component';

describe('ToolGroupComponent', () => {
  let component: ToolGroupComponent;
  let fixture: ComponentFixture<ToolGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
