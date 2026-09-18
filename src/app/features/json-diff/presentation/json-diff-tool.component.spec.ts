import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { JsonDiffToolComponent } from './json-diff-tool.component';
import type { JsonDiffResult } from '../application/json-diff.use-cases';

const RESULT: JsonDiffResult = {
  ok: true,
  equivalent: false,
  issues: [],
  summary: { added: 1, removed: 0, changed: 1, typeChanged: 0, moved: 0, total: 2 },
  changes: [
    { kind: 'changed', path: '/version', before: '"1"', after: '"2"', beforeIndex: null, afterIndex: null },
    { kind: 'added', path: '/active', before: '', after: 'true', beforeIndex: null, afterIndex: null },
  ],
  changesTruncated: false,
  patch: '[\n  { "op": "replace", "path": "/version", "value": "2" }\n]',
  report: '{"summary":{"total":2}}',
  stats: { leftCharacters: 15, rightCharacters: 29, leftNodes: 2, rightNodes: 3, ignoredPaths: 0 },
};

describe('JsonDiffToolComponent', () => {
  it('affiche les deux éditeurs et la confidentialité locale', async () => {
    const fixture = await createFixture();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h1')?.textContent).toContain('Comparer deux JSON');
    expect(host.querySelectorAll('.editor-card')).toHaveLength(2);
    expect(host.textContent).toContain('Vos JSON restent dans ce navigateur');
  });

  it('met à jour les sources, la stratégie et les chemins ignorés', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;

    component.updateSource('left', eventWithValue('{"x":1}'));
    component.updateArrayMode(eventWithValue('key'));
    component.updateArrayKey(eventWithValue('/meta/id'));
    component.updateIgnoredPaths(eventWithValue('/updatedAt'));

    expect(component.leftSource()).toBe('{"x":1}');
    expect(component.options()).toEqual({
      arrayMode: 'key',
      arrayKey: '/meta/id',
      ignoredPaths: '/updatedAt',
    });
    expect(component.result()).toBeNull();
  });

  it('inverse les documents et leurs noms de fichiers', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;
    component.leftSource.set('{"side":"left"}');
    component.rightSource.set('{"side":"right"}');
    component.leftFileName.set('left.json');
    component.rightFileName.set('right.json');

    component.swapDocuments();

    expect(component.leftSource()).toContain('right');
    expect(component.rightSource()).toContain('left');
    expect(component.leftFileName()).toBe('right.json');
    expect(component.rightFileName()).toBe('left.json');
  });

  it('affiche le résumé et les chemins renvoyés par le Worker', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;
    const execute = vi.fn().mockResolvedValue(RESULT);
    replacePrivate(component, 'compareUseCase', { execute });

    await component.compare();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(component.state()).toBe('done');
    expect(execute).toHaveBeenCalledOnce();
    expect(host.querySelector('[data-testid="json-diff-result"]')?.textContent)
      .toContain('/version');
    expect(host.textContent).toContain('2 différences détectées');
  });

  it('rend les erreurs métier compréhensibles sans exposer leur détail brut', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;
    const result: JsonDiffResult = {
      ...RESULT,
      ok: false,
      issues: [{ code: 'duplicate-key', side: 'right', path: '', detail: 'secret-key', position: 12 }],
      changes: [],
      patch: '',
      report: '',
    };
    replacePrivate(component, 'compareUseCase', { execute: vi.fn().mockResolvedValue(result) });

    await component.compare();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const text = host.querySelector('[role="alert"]')?.textContent ?? '';
    expect(text).toContain('deux fois le même nom de propriété');
    expect(text).toContain('Document droit');
    expect(text).not.toContain('secret-key');
  });

  it('réinitialise les options et retire un ancien résultat', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;
    component.result.set(RESULT);
    component.options.set({ arrayMode: 'key', arrayKey: '/uuid', ignoredPaths: '/date' });

    component.resetExamples();

    expect(component.options()).toEqual({ arrayMode: 'index', arrayKey: '/id', ignoredPaths: '' });
    expect(component.result()).toBeNull();
    expect(component.leftSource()).toContain('utilisateurs');
  });
});

async function createFixture() {
  await TestBed.configureTestingModule({ imports: [JsonDiffToolComponent] }).compileComponents();
  const fixture = TestBed.createComponent(JsonDiffToolComponent);
  fixture.detectChanges();
  return fixture;
}

function eventWithValue(value: string): Event {
  return { target: { value } } as unknown as Event;
}

function replacePrivate(
  component: JsonDiffToolComponent,
  key: 'compareUseCase',
  value: { execute: (...args: unknown[]) => Promise<JsonDiffResult> },
): void {
  (component as unknown as Record<string, unknown>)[key] = value;
}
