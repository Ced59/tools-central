import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { StructuredDataExtractorToolComponent } from './structured-data-extractor-tool.component';

describe('StructuredDataExtractorToolComponent', () => {
  let component: StructuredDataExtractorToolComponent;
  let fixture: ComponentFixture<StructuredDataExtractorToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StructuredDataExtractorToolComponent],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' }],
    }).compileComponents();
    fixture = TestBed.createComponent(StructuredDataExtractorToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('présente un exemple JSON-LD analysé dès l’ouverture', () => {
    expect(component.errorCount()).toBe(0);
    expect(component.analysis().nodes).toHaveLength(2);
    expect(component.analysis().typeCounts.map(entry => entry.type)).toEqual(['Article', 'Organization']);
  });

  it('analyse une nouvelle source uniquement sur demande', () => {
    component.source.set('<div itemscope itemtype="https://schema.org/Product"><span itemprop="name">Produit</span></div>');
    expect(component.analysis().typeCounts.map(entry => entry.type)).not.toContain('https://schema.org/Product');

    component.analyze();

    expect(component.analysis().formatCounts.microdata).toBe(1);
    expect(component.analysis().nodes[0].properties[0]).toMatchObject({ name: 'name', value: 'Produit' });
  });

  it('affiche les erreurs JSON et désélectionne le graphe vide', () => {
    component.source.set('<script type="application/ld+json">{"@type":</script>');
    component.analyze();

    expect(component.errorCount()).toBe(1);
    expect(component.analysis().issues.map(issue => issue.code)).toContain('invalid-json');
    expect(component.selectedNode()).toBeNull();
  });

  it('permet de sélectionner une entité puis restaure l’exemple', () => {
    const secondId = component.analysis().nodes[1].id;
    component.selectNode(component.analysis().nodes[1].format, secondId);
    expect(component.selectedNode()).toMatchObject({ id: secondId });

    component.source.set('');
    component.reset();

    expect(component.analysis().nodes).toHaveLength(2);
    expect(component.source()).toContain('"@graph"');
  });
});
