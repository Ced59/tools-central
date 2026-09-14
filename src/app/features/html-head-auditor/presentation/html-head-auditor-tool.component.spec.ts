import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { HtmlHeadAuditorToolComponent } from './html-head-auditor-tool.component';

describe('HtmlHeadAuditorToolComponent', () => {
  let component: HtmlHeadAuditorToolComponent;
  let fixture: ComponentFixture<HtmlHeadAuditorToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HtmlHeadAuditorToolComponent],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' }],
    }).compileComponents();
    fixture = TestBed.createComponent(HtmlHeadAuditorToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('présente un exemple complet sans erreur ni avertissement', () => {
    expect(component.errorCount()).toBe(0);
    expect(component.warningCount()).toBe(0);
    expect(component.audit().canonical).toBe('https://example.com/fr/guide');
    expect(component.audit().alternates).toHaveLength(2);
  });

  it('n’analyse une modification que sur demande', () => {
    component.source.set('<head><title>Autre</title></head>');
    expect(component.audit().title).not.toBe('Autre');

    component.analyze();

    expect(component.audit().title).toBe('Autre');
    expect(component.audit().issues.map(issue => issue.code)).toContain('missing-canonical');
  });

  it('signale un head contradictoire et incomplet', () => {
    component.source.set('<head><title>A</title><title>B</title><meta name="robots" content="index,noindex"><link rel="canonical" href="/relative"><meta property="og:title" content="A"></head>');
    component.analyze();

    expect(component.errorCount()).toBeGreaterThan(0);
    expect(component.audit().issues.map(issue => issue.code)).toEqual(expect.arrayContaining([
      'multiple-title', 'page-noindex', 'invalid-canonical', 'missing-open-graph-property',
    ]));
  });

  it('restaure l’exemple initial', () => {
    component.source.set('');
    component.pageUrl.set('');
    component.reset();

    expect(component.source()).toContain('<meta charset="utf-8">');
    expect(component.pageUrl()).toBe('https://example.com/fr/guide');
    expect(component.audit().issues).toHaveLength(0);
  });

  it('formate les compteurs selon la locale', () => {
    expect(component.formatNumber(1_000)).toBe(new Intl.NumberFormat('fr', { maximumFractionDigits: 0 }).format(1_000));
  });
});
