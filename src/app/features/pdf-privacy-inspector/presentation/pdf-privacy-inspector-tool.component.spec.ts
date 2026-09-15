import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PdfPrivacyInspectorToolComponent } from './pdf-privacy-inspector-tool.component';
import { PdfPrivacyValidationError } from '../application/pdf-privacy.use-cases';
import { buildPdfPrivacyReport } from '../domain/pdf-privacy.models';

describe('PdfPrivacyInspectorToolComponent', () => {
  let fixture: ComponentFixture<PdfPrivacyInspectorToolComponent>;
  let component: PdfPrivacyInspectorToolComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PdfPrivacyInspectorToolComponent] }).compileComponents();
    fixture = TestBed.createComponent(PdfPrivacyInspectorToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sélectionne un PDF et rend l’action disponible', () => {
    selectFile(component, new File(['%PDF-1.7'], 'rapport.pdf', { type: 'application/pdf' }));

    expect(component.state()).toBe('ready');
    expect(component.canInspect()).toBe(true);
    expect(component.file()?.name).toBe('rapport.pdf');
  });

  it('demande le mot de passe après la réponse dédiée du Worker', async () => {
    selectFile(component, new File(['%PDF-1.7'], 'protege.pdf', { type: 'application/pdf' }));
    component.updatePassword({ target: { value: 'secret' } } as unknown as Event);
    vi.spyOn(component['inspectUseCase'], 'execute')
      .mockRejectedValue(new PdfPrivacyValidationError('password-required'));

    await component.inspect();
    fixture.detectChanges();

    expect(component.passwordRequired()).toBe(true);
    expect(component.password()).toBe('');
    expect(component.state()).toBe('error');
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#pdf-privacy-password')).not.toBeNull();
  });

  it('affiche et filtre un rapport comportemental', async () => {
    selectFile(component, new File(['%PDF-1.7'], 'rapport.pdf', { type: 'application/pdf' }));
    const report = buildPdfPrivacyReport({
      pdfVersion: '1.7', pageCount: 2, inspectedPages: 2, fileBytes: 10,
      encrypted: false, passwordUsed: false,
      findings: [
        { id: 'js', category: 'active-content', kind: 'javascript', severity: 'high', label: 'OpenAction' },
        { id: 'meta', category: 'metadata', kind: 'document-metadata', severity: 'low', label: 'Author', value: 'Alice' },
      ],
    });
    vi.spyOn(component['inspectUseCase'], 'execute').mockResolvedValue(report);

    await component.inspect();
    component.selectCategory('metadata');
    fixture.detectChanges();

    expect(component.state()).toBe('done');
    expect(component.visibleFindings()).toHaveLength(1);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="pdf-privacy-result"]')?.textContent).toContain('Alice');
    expect(element.querySelector('[data-testid="pdf-privacy-result"]')?.textContent).not.toContain('OpenAction');
  });

  it('rend les codes sémantiques du Worker via la couche de présentation', () => {
    expect(component.findingMessage({ code: 'form-actions' })).toBe('JavaScript embarqué');
    expect(component.findingMessage({
      code: 'dictionary-action', actionType: 'URI', context: 'open-action',
    })).toBe('OpenAction · URI');
    expect(component.findingMessage({
      code: 'dictionary-action', actionType: 'Launch', context: 'other', targetStatus: 'too-long',
    })).toBe('Launch · Cible trop longue pour être affichée');
    expect(component.findingMessage({
      code: 'signature-details',
      index: 1,
      contactInfo: 'signer@example.test',
      location: 'Paris',
      reason: 'Validation interne',
      signingTime: 'D:20260915113000+02\'00\'',
    })).toContain('ContactInfo: signer@example.test · Location: Paris · Reason: Validation interne · M: D:20260915113000+02\'00\'');
  });
});

function selectFile(component: PdfPrivacyInspectorToolComponent, file: File): void {
  const input = document.createElement('input');
  Object.defineProperty(input, 'files', { value: [file] });
  component.selectFile({ target: input } as unknown as Event);
}
