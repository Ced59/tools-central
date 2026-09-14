import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { HreflangCheckerToolComponent } from './hreflang-checker-tool.component';

describe('HreflangCheckerToolComponent', () => {
  let component: HreflangCheckerToolComponent;
  let fixture: ComponentFixture<HreflangCheckerToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HreflangCheckerToolComponent],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' }],
    }).compileComponents();
    fixture = TestBed.createComponent(HreflangCheckerToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts with a valid generator example', () => {
    expect(component.builderErrorCount()).toBe(0);
    expect(component.setAnalysis().entries).toHaveLength(4);
    expect(component.activeOutput()).toContain('hreflang="fr"');
  });

  it('switches between HTML, HTTP and sitemap output', () => {
    component.setOutputFormat('httpHeader');
    expect(component.activeOutput()).toMatch(/^Link:/u);

    component.setOutputFormat('sitemapXml');
    expect(component.activeOutput()).toContain('<xhtml:link');
  });

  it('reports an invalid set and prevents a safe export state', () => {
    component.currentUrl.set('https://example.com/fr');
    component.alternateLines.set('fr | /fr');

    expect(component.builderErrorCount()).toBeGreaterThan(0);
    expect(component.setAnalysis().issues.map(issue => issue.code)).toContain('invalid-url');
  });

  it('runs a multi-page reciprocity audit only when requested', () => {
    component.auditSource.set([
      'PAGE https://example.com/fr | https://example.com/fr',
      'fr | https://example.com/fr',
      'en | https://example.com/en',
      'PAGE https://example.com/en | https://example.com/en',
      'en | https://example.com/en',
    ].join('\n'));

    component.runAudit();

    expect(component.auditErrorCount()).toBeGreaterThan(0);
    expect(component.audit().issues.map(issue => issue.code)).toContain('missing-return-link');
  });

  it('restores valid examples on reset', () => {
    component.currentUrl.set('invalid');
    component.auditSource.set('invalid');

    component.reset();

    expect(component.builderErrorCount()).toBe(0);
    expect(component.auditErrorCount()).toBe(0);
  });
});
