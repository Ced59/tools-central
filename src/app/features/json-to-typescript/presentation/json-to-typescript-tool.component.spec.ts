import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { JsonToTypeScriptToolComponent } from './json-to-typescript-tool.component';
import {
  generateTypeScriptFromJson,
  type JsonToTypeScriptResult,
} from '../domain/json-to-typescript.models';

const RESULT = generateTypeScriptFromJson('{"id":1,"name":"Ada"}', {
  rootName: 'User',
  declarationKind: 'interface',
  arrayObjectMode: 'merge',
  inferDates: false,
  readonlyProperties: false,
});

describe('JsonToTypeScriptToolComponent', () => {
  it('renders the generator, local privacy statement, and responsive workspace', async () => {
    const fixture = await createFixture();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h1')?.textContent).toContain('Générer des types TypeScript depuis JSON');
    expect(host.querySelector('.privacy-note')?.textContent).toContain('reste sur cet appareil');
    expect(host.querySelector('#json-ts-source')).not.toBeNull();
    expect(host.querySelector('#json-ts-root-name')).not.toBeNull();
  });

  it('updates every generation option and clears stale results', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;
    component.result.set(RESULT);

    component.updateSource(eventWithValue('{"active":true}'));
    component.updateRootName(eventWithValue('api response'));
    component.updateDeclarationKind(eventWithValue('type'));
    component.updateArrayObjectMode(eventWithValue('union'));
    component.updateInferDates(eventWithChecked(false));
    component.updateReadonlyProperties(eventWithChecked(true));

    expect(component.source()).toBe('{"active":true}');
    expect(component.options()).toEqual({
      rootName: 'api response',
      declarationKind: 'type',
      arrayObjectMode: 'union',
      inferDates: false,
      readonlyProperties: true,
    });
    expect(component.result()).toBeNull();
  });

  it('renders the Worker output, statistics, and warnings', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;
    const result = generateTypeScriptFromJson('[{"id":1},{"id":2,"name":"Ada"}]', {
      ...component.options(),
      rootName: 'Users',
    });
    const execute = vi.fn().mockResolvedValue(result);
    replacePrivate(component, 'generateUseCase', { execute });

    await component.generate();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(component.state()).toBe('done');
    expect(execute).toHaveBeenCalledOnce();
    expect(host.querySelector('[data-testid="json-ts-result"]')?.textContent).toContain('Users');
    expect(host.querySelector('.output-card pre')?.textContent).toContain('export type Users');
    expect(host.querySelector('.warnings')?.textContent).toContain('optionnelle');
  });

  it('describes parser errors without exposing raw property names', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;
    const result: JsonToTypeScriptResult = {
      ...RESULT,
      ok: false,
      output: '',
      issues: [{ code: 'duplicate-key', position: 12, detail: 'private-token-123' }],
      warnings: [],
    };
    replacePrivate(component, 'generateUseCase', { execute: vi.fn().mockResolvedValue(result) });

    await component.generate();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement)
      .querySelector('[data-testid="json-ts-issues"]')?.textContent ?? '';
    expect(text).toContain('deux fois le même nom de propriété');
    expect(text).toContain('Position');
    expect(text).not.toContain('private-token-123');
  });

  it('keeps generation disabled while an asynchronous file read is pending', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;
    let resolveRead: ((value: string) => void) | undefined;
    const pendingRead = new Promise<string>(resolve => {
      resolveRead = resolve;
    });
    replacePrivate(component, 'readFileUseCase', { execute: vi.fn().mockReturnValue(pendingRead) });
    const execute = vi.fn().mockResolvedValue(RESULT);
    replacePrivate(component, 'generateUseCase', { execute });

    const loadPromise = component.loadFile(fileEvent(new File(['{"fresh":true}'], 'fresh.json')));
    expect(component.state()).toBe('loading');
    expect(component.canGenerate()).toBe(false);
    await component.generate();
    expect(execute).not.toHaveBeenCalled();

    resolveRead?.('{"fresh":true}');
    await loadPromise;
    expect(component.source()).toBe('{"fresh":true}');
    expect(component.state()).toBe('idle');
  });

  it('loads distinct examples with matching root names', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;

    component.loadExample('api');
    expect(component.source()).toContain('displayName');
    expect(component.options().rootName).toBe('Utilisateurs');

    component.loadExample('order');
    expect(component.source()).toContain('createdAt');
    expect(component.options().rootName).toBe('Commande');
  });
});

async function createFixture() {
  await TestBed.configureTestingModule({ imports: [JsonToTypeScriptToolComponent] }).compileComponents();
  const fixture = TestBed.createComponent(JsonToTypeScriptToolComponent);
  fixture.detectChanges();
  return fixture;
}

function eventWithValue(value: string): Event {
  return { target: { value } } as unknown as Event;
}

function eventWithChecked(checked: boolean): Event {
  return { target: { checked } } as unknown as Event;
}

function fileEvent(file: File): Event {
  return { target: { files: [file], value: 'selected' } } as unknown as Event;
}

function replacePrivate(
  component: JsonToTypeScriptToolComponent,
  key: 'generateUseCase' | 'readFileUseCase',
  value: unknown,
): void {
  (component as unknown as Record<string, unknown>)[key] = value;
}
