import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { SitemapXmlBuilderToolComponent } from './sitemap-xml-builder-tool.component';

describe('SitemapXmlBuilderToolComponent', () => {
  let component: SitemapXmlBuilderToolComponent;
  let fixture: ComponentFixture<SitemapXmlBuilderToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SitemapXmlBuilderToolComponent],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' }],
    }).compileComponents();

    fixture = TestBed.createComponent(SitemapXmlBuilderToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('generates a valid localized URL sitemap by default', () => {
    expect(component.analysis().issues).toEqual([]);
    expect(component.analysis().kind).toBe('urlset');
    expect(component.content()).toContain('https://www.tools-central.com/fr/');
  });

  it('switches to a sitemap index and regenerates matching XML', () => {
    component.setKind('sitemapindex');

    expect(component.kind()).toBe('sitemapindex');
    expect(component.analysis().kind).toBe('sitemapindex');
    expect(component.content()).toContain('<sitemapindex');
    expect(component.sitemapUrl()).toContain('sitemap-index.xml');
  });

  it('updates validation when malformed XML is pasted', () => {
    component.content.set('<urlset>');

    expect(component.errorCount()).toBeGreaterThan(0);
    expect(component.analysis().issues.map(issue => issue.code)).toContain('malformed-xml');
  });

  it('reports invalid and duplicate builder lines before generation', () => {
    component.sourceLines.set('/ok\n/ok\nhttps://other.test/page');

    expect(component.builderValidation().issues.map(issue => issue.code)).toEqual([
      'duplicate-loc',
      'different-origin',
    ]);
  });

  it('restores URL sitemap defaults for the active locale', () => {
    component.setKind('sitemapindex');
    component.siteUrl.set('https://example.com');

    component.reset();

    expect(component.kind()).toBe('urlset');
    expect(component.siteUrl()).toBe('https://www.tools-central.com');
    expect(component.sourceLines()).toContain('/fr/');
  });
});
