import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { ImagesToPdfToolComponent } from './images-to-pdf-tool.component';

describe('ImagesToPdfToolComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagesToPdfToolComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders an accessible local-first empty state', () => {
    const fixture = TestBed.createComponent(ImagesToPdfToolComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Convertir des images en PDF');
    expect(element.querySelector('input[type="file"]')?.hasAttribute('multiple')).toBe(true);
    expect(element.querySelector('input[type="file"]')?.getAttribute('accept')).toContain('image/webp');
    expect(element.textContent).toContain('Aucun envoi');
  });

  it('provides localized page and compression labels', () => {
    const component = TestBed.createComponent(ImagesToPdfToolComponent).componentInstance;
    expect(component.pageFormatLabel('letter-landscape')).toContain('paysage');
    expect(component.compressionLabel('compact')).toContain('compact');
  });

  it('cancels active work when destroyed', () => {
    const fixture = TestBed.createComponent(ImagesToPdfToolComponent);
    const component = fixture.componentInstance;
    const preparation = new AbortController();
    const generation = new AbortController();
    const internals = component as unknown as {
      taskRevision: number;
      preparationAbortController: AbortController | null;
      generationAbortController: AbortController | null;
    };
    const revision = internals.taskRevision;
    internals.preparationAbortController = preparation;
    internals.generationAbortController = generation;

    fixture.destroy();

    expect(internals.taskRevision).toBe(revision + 1);
    expect(preparation.signal.aborted).toBe(true);
    expect(generation.signal.aborted).toBe(true);
    expect(internals.preparationAbortController).toBeNull();
    expect(internals.generationAbortController).toBeNull();
  });
});
