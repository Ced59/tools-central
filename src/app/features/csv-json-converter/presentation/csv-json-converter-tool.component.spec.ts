import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { CsvJsonConverterToolComponent } from './csv-json-converter-tool.component';

describe('CsvJsonConverterToolComponent', () => {
  let component: CsvJsonConverterToolComponent;
  let fixture: ComponentFixture<CsvJsonConverterToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CsvJsonConverterToolComponent],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' }],
    }).compileComponents();
    fixture = TestBed.createComponent(CsvJsonConverterToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('présente une source CSV locale et des contrôles accessibles', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(component.options().direction).toBe('csv-to-json');
    expect(host.querySelector('h1')?.textContent).toContain('CSV');
    expect(host.querySelector<HTMLTextAreaElement>('#csv-json-source')?.value).toContain('Ada');
    expect(host.querySelectorAll('[role="group"] button')).toHaveLength(2);
  });

  it('bascule vers JSON sans conserver un mapping incompatible', () => {
    component.options.update(options => ({ ...options, mapping: 'nom => name' }));

    component.selectDirection('json-to-csv');

    expect(component.options().direction).toBe('json-to-csv');
    expect(component.options().mapping).toBe('');
    expect(component.source()).toContain('profil');
  });

  it('invalide un résultat lorsque les options changent', () => {
    component.result.set({
      ok: true,
      direction: 'csv-to-json',
      output: '[]',
      outputMediaType: 'application/json;charset=utf-8',
      outputExtension: 'json',
      detectedDelimiter: 'comma',
      previewHeaders: [],
      previewRows: [],
      issues: [],
      stats: { inputRows: 0, outputRows: 0, columns: 0, inputCharacters: 0, outputCharacters: 2 },
    });

    component.updateBooleanOption('inferTypes', { target: { checked: false } } as unknown as Event);

    expect(component.result()).toBeNull();
    expect(component.options().inferTypes).toBe(false);
  });

  it('ramène aussi une conversion en cours à un état inactif quand une option change', () => {
    component.state.set('processing');

    component.updateBooleanOption('trimCells', { target: { checked: true } } as unknown as Event);

    expect(component.state()).toBe('idle');
    expect(component.options().trimCells).toBe(true);
  });

  it('décrit un diagnostic avec une position localisée', () => {
    const label = component.issueLabel({
      code: 'unclosed-quote',
      severity: 'error',
      row: 2,
      column: 3,
      detail: '',
    });

    expect(label).toContain('guillemets');
    expect(label).toContain('2');
    expect(label).toContain('3');
  });

  it('annonce les diagnostics en erreur aux technologies d’assistance', () => {
    component.result.set({
      ok: false,
      direction: 'json-to-csv',
      output: '',
      outputMediaType: 'text/csv;charset=utf-8',
      outputExtension: 'csv',
      detectedDelimiter: 'comma',
      previewHeaders: [],
      previewRows: [],
      issues: [{ code: 'json-invalid', severity: 'error', row: null, column: null, detail: '' }],
      stats: { inputRows: 0, outputRows: 0, columns: 0, inputCharacters: 1, outputCharacters: 0 },
    });
    fixture.detectChanges();

    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.getAttribute('aria-live')).toBe('assertive');
    expect(alert?.textContent).toContain('JSON valide');
  });
});
