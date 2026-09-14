import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('blocks drag reordering while a PDF is being generated', () => {
    const component = TestBed.createComponent(ImagesToPdfToolComponent).componentInstance;
    const preventDefault = vi.fn();
    const setData = vi.fn();
    const event = {
      preventDefault,
      dataTransfer: { setData },
    } as unknown as DragEvent;
    component.state.set('generating');

    component.startImageDrag('one', event);

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(setData).not.toHaveBeenCalled();
  });

  it('keeps a visible cancel action available during generation', () => {
    const fixture = TestBed.createComponent(ImagesToPdfToolComponent);
    fixture.componentInstance.progress.set({ completed: 1, total: 3 });
    fixture.componentInstance.state.set('generating');
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.progress-card .cancel-button');
    const progress = (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLProgressElement>('.progress-card progress');

    expect(button?.textContent).toContain('Annuler');
    expect(button?.disabled).toBe(false);
    expect(progress?.getAttribute('aria-labelledby')).toBe('images-to-pdf-progress-label');

    fixture.componentInstance.generatedPdf.set(new Blob(['pdf'], { type: 'application/pdf' }));
    fixture.componentInstance.state.set('done');
    fixture.detectChanges();
    const result = (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLElement>('[data-testid="images-to-pdf-result"]');
    expect(result?.getAttribute('role')).toBe('status');
    expect(result?.getAttribute('aria-live')).toBe('polite');
  });
});
