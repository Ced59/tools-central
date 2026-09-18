import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { validateJsonSchemaDocuments } from '../infrastructure/json-schema-validator.engine';
import type {
  JsonSchemaValidatorWorkerRequest,
  JsonSchemaValidatorWorkerResponse,
} from '../infrastructure/json-schema-validator.worker.messages';
import { JsonSchemaValidatorToolComponent } from './json-schema-validator-tool.component';

class TestWorker {
  static instances: TestWorker[] = [];
  onmessage: ((event: MessageEvent<JsonSchemaValidatorWorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly terminate = vi.fn();

  constructor() {
    TestWorker.instances.push(this);
  }

  postMessage(message: JsonSchemaValidatorWorkerRequest): void {
    queueMicrotask(() => {
      const result = validateJsonSchemaDocuments(message.schema, message.instance, message.options);
      this.onmessage?.({ data: { type: 'success', result } } as MessageEvent<JsonSchemaValidatorWorkerResponse>);
    });
  }
}

describe('JsonSchemaValidatorToolComponent', () => {
  const originalWorker = globalThis.Worker;

  beforeEach(async () => {
    TestWorker.instances = [];
    Object.defineProperty(globalThis, 'Worker', { configurable: true, writable: true, value: TestWorker });
    await TestBed.configureTestingModule({
      imports: [JsonSchemaValidatorToolComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'Worker', { configurable: true, writable: true, value: originalWorker });
    TestBed.resetTestingModule();
  });

  it('renders an accessible local validation workspace', () => {
    const fixture = TestBed.createComponent(JsonSchemaValidatorToolComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent).toContain('Valider un JSON');
    expect(root.querySelector('#json-schema-schema')).not.toBeNull();
    expect(root.querySelector('#json-schema-instance')).not.toBeNull();
    expect(root.textContent).toContain('Vos données ne quittent pas cet appareil');
  });

  it('validates the invalid example and exposes localized paths plus a valid correction', async () => {
    const fixture = TestBed.createComponent(JsonSchemaValidatorToolComponent);
    const component = fixture.componentInstance;
    await component.validate();
    fixture.detectChanges();

    expect(component.result()).toMatchObject({ ok: true, valid: false, draft: 'draft-2020-12' });
    expect(component.result()?.errors.map(error => error.instancePath)).toContain('/email');
    expect(component.result()?.correction?.valid).toBe(true);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="json-schema-result"]')).not.toBeNull();
    expect(root.textContent).toContain('Proposition corrigée');
  });

  it('validates the valid preset without generating a correction', async () => {
    const fixture = TestBed.createComponent(JsonSchemaValidatorToolComponent);
    const component = fixture.componentInstance;
    component.loadExample('valid');
    await component.validate();
    fixture.detectChanges();
    expect(component.result()?.valid).toBe(true);
    expect(component.result()?.correction).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Le JSON est valide');
  });

  it('applies a generated correction back to the instance editor', async () => {
    const fixture = TestBed.createComponent(JsonSchemaValidatorToolComponent);
    const component = fixture.componentInstance;
    await component.validate();
    const corrected = component.result()?.correction?.source;
    component.applyCorrection();
    expect(component.instanceSource()).toBe(corrected);
    expect(component.result()).toBeNull();
    expect(component.state()).toBe('idle');
  });

  it('clears stale results when an option changes', async () => {
    const fixture = TestBed.createComponent(JsonSchemaValidatorToolComponent);
    const component = fixture.componentInstance;
    await component.validate();
    component.updateDraft({ target: { value: 'draft-07' } } as unknown as Event);
    expect(component.options().draft).toBe('draft-07');
    expect(component.result()).toBeNull();
  });

  it('cancels a running worker and resets the state', () => {
    const fixture = TestBed.createComponent(JsonSchemaValidatorToolComponent);
    const component = fixture.componentInstance;
    void component.validate();
    expect(component.state()).toBe('processing');
    component.cancelValidation();
    expect(component.state()).toBe('idle');
    expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
  });

  it('describes validation keywords without exposing raw Ajv messages', () => {
    const component = TestBed.createComponent(JsonSchemaValidatorToolComponent).componentInstance;
    expect(component.validationErrorLabel({
      keyword: 'required',
      instancePath: '',
      schemaPath: '#/required',
      property: 'name',
      expected: 'name',
      limit: null,
    })).toContain('name');
    expect(component.validationErrorLabel({
      keyword: 'customRule',
      instancePath: '/value',
      schemaPath: '#/customRule',
      property: '',
      expected: '',
      limit: null,
    })).toContain('customRule');
  });
});
