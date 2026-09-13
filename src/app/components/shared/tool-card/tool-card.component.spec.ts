import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolCardComponent } from './tool-card.component';

describe('ToolCardComponent', () => {
  let component: ToolCardComponent;
  let fixture: ComponentFixture<ToolCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tool', {
      id: 'percentage',
      title: 'Pourcentage',
      description: 'Calculer un pourcentage',
      icon: 'tc-icon tc-icon-percentage',
      route: '/categories/math/percentages/percentage',
      available: true,
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
