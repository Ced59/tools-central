import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { RobotsTxtBuilderToolComponent } from './robots-txt-builder-tool.component';

describe('RobotsTxtBuilderToolComponent', () => {
  let component: RobotsTxtBuilderToolComponent;
  let fixture: ComponentFixture<RobotsTxtBuilderToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RobotsTxtBuilderToolComponent],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' }],
    }).compileComponents();

    fixture = TestBed.createComponent(RobotsTxtBuilderToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('generates a valid local starter file', () => {
    expect(component.analysis().issues).toEqual([]);
    expect(component.content()).toContain('User-agent: *');
    expect(component.content()).toContain('Sitemap: https://www.tools-central.com/sitemap.xml');
  });

  it('updates validation when the editor changes', () => {
    component.content.set('Disallow: /private/');

    expect(component.errorCount()).toBeGreaterThan(0);
    expect(component.analysis().issues.map(issue => issue.code)).toContain('orphan-rule');
  });

  it('applies the block-all preset and exposes a blocked decision', () => {
    component.applyPreset('block-all');

    expect(component.content()).toContain('Disallow: /');
    expect(component.decision().allowed).toBe(false);
  });

  it('lets a more specific generated allow rule override a blocked prefix', () => {
    component.siteUrl.set('https://example.com');
    component.allowPaths.set('/private/public/');
    component.disallowPaths.set('/private/');
    component.testUrl.set('https://example.com/private/public/page');
    component.generate();

    expect(component.decision().allowed).toBe(true);
    expect(component.decision().matchedRule?.directive).toBe('allow');
  });

  it('restores defaults including the active locale test URL', () => {
    component.siteUrl.set('https://example.com');
    component.testUrl.set('/other');

    component.reset();

    expect(component.siteUrl()).toBe('https://www.tools-central.com');
    expect(component.testUrl()).toContain('/fr/categories/');
  });
});
