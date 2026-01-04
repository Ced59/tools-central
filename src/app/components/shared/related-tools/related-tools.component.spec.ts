import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { RelatedToolsComponent } from './related-tools.component';

describe('RelatedToolsComponent', () => {
  let component: RelatedToolsComponent;
  let fixture: ComponentFixture<RelatedToolsComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RelatedToolsComponent,
        RouterTestingModule.withRoutes([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RelatedToolsComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should auto-detect tool from URL and compute related tools', () => {
    // Simuler une URL d'outil
    spyOnProperty(router, 'url', 'get').and.returnValue('/categories/math/percentages/percentage-variation');
    
    fixture.detectChanges();
    
    // Devrait avoir trouvé des outils liés
    expect(component.relatedTools.length).toBeGreaterThan(0);
  });

  it('should exclude current tool from related tools', () => {
    spyOnProperty(router, 'url', 'get').and.returnValue('/categories/math/percentages/percentage-variation');
    
    fixture.detectChanges();
    
    const hasCurrentTool = component.relatedTools.some(
      (t) => t.id === 'percentage-variation'
    );
    expect(hasCurrentTool).toBeFalse();
  });

  it('should respect count config', () => {
    spyOnProperty(router, 'url', 'get').and.returnValue('/categories/math/percentages/percentage-variation');
    
    component.config = { count: 3 };
    fixture.detectChanges();
    
    expect(component.relatedTools.length).toBeLessThanOrEqual(3);
  });

  it('should prioritize specified tools', () => {
    spyOnProperty(router, 'url', 'get').and.returnValue('/categories/math/percentages/percentage-variation');
    
    component.config = {
      priorityToolIds: ['percentage-of-number', 'percentage-what-percent'],
    };
    fixture.detectChanges();
    
    // Les outils prioritaires devraient être en premier
    if (component.relatedTools.length >= 2) {
      expect(component.relatedTools[0].id).toBe('percentage-of-number');
      expect(component.relatedTools[1].id).toBe('percentage-what-percent');
    }
  });

  it('should generate correct router link segments', () => {
    const mockTool = {
      id: 'test-tool',
      route: '/categories/math/percentages/test-tool',
    } as any;

    const link = component.getToolLink(mockTool);
    
    // Doit retourner des segments séparés, pas une seule chaîne
    expect(link).toEqual(['/', 'categories', 'math', 'percentages', 'test-tool']);
  });

  it('should return empty array if not on a tool page', () => {
    spyOnProperty(router, 'url', 'get').and.returnValue('/categories/math');
    
    fixture.detectChanges();
    
    expect(component.relatedTools.length).toBe(0);
  });
});
