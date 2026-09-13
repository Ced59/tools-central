import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { SerpSnippetPreviewToolComponent } from './serp-snippet-preview-tool.component';

describe('SerpSnippetPreviewToolComponent', () => {
  let component: SerpSnippetPreviewToolComponent;
  let fixture: ComponentFixture<SerpSnippetPreviewToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SerpSnippetPreviewToolComponent],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' }],
    }).compileComponents();

    fixture = TestBed.createComponent(SerpSnippetPreviewToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('switches to the narrower mobile preview', () => {
    component.selectDevice('mobile');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const preview = host.querySelector<HTMLElement>('[data-testid="serp-preview"]');
    expect(preview).not.toBeNull();
    if (!preview) return;
    expect(preview.classList.contains('browser-frame--mobile')).toBe(true);
    expect(component.analysis().title.maximumPixels).toBe(520);
  });

  it('restores the localized defaults', () => {
    component.title.set('Titre temporaire');
    component.device.set('mobile');

    component.reset();

    expect(component.title()).toContain('Prévisualiseur');
    expect(component.url()).toContain('/fr/categories/');
    expect(component.device()).toBe('desktop');
  });

  it('keeps progressbar values within their accessible range', () => {
    component.title.set('W'.repeat(100));
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const meter = host.querySelector<HTMLElement>('[role="progressbar"]');
    expect(meter?.getAttribute('aria-valuenow')).toBe('580');
    expect(meter?.getAttribute('aria-valuemax')).toBe('580');
  });

  it('formats visible measurements with the active locale', () => {
    expect(component.formatNumber(1000)).not.toBe('1000');
  });
});
