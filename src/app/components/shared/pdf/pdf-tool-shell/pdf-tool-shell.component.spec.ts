import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { vi } from 'vitest';

import { PdfToolShellComponent } from './pdf-tool-shell.component';

describe('PdfToolShellComponent', () => {
  let component: PdfToolShellComponent;
  let fixture: ComponentFixture<PdfToolShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfToolShellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfToolShellComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ui', {
      btnPick: 'Choisir',
      btnReset: 'Réinitialiser',
      btnCopy: 'Copier',
      btnDownload: 'Télécharger',
      placeholderFilter: 'Filtrer',
      statusLoading: 'Chargement',
      statusReady: 'Prêt',
      statusError: 'Erreur',
      importTitle: 'Importer',
      importSub: 'Sélectionner un PDF',
      resultsTitle: 'Résultats',
      resultsSub: 'Détails',
      jsonTitle: 'JSON',
      jsonSub: 'Données extraites',
      leftTitle: 'Éléments',
      emptyText: 'Aucun résultat',
      backText: 'Retour',
    });
    fixture.componentRef.setInput('filterControl', new FormControl('', { nonNullable: true }));
    fixture.detectChanges();
  });

  it('emits a valid local PDF selection', () => {
    const emit = vi.spyOn(component.fileSelected, 'emit');
    const file = new File(['%PDF-1.7'], 'document.pdf', { type: 'application/pdf' });

    component.onFileChange(fileEvent(file));

    expect(emit).toHaveBeenCalledWith(file);
    expect(component.selectionError).toBe('');
  });

  it('rejects a non-PDF before it reaches a parser', () => {
    const emit = vi.spyOn(component.fileSelected, 'emit');
    const file = new File(['plain text'], 'document.txt', { type: 'text/plain' });

    component.onFileChange(fileEvent(file));

    expect(emit).not.toHaveBeenCalled();
    expect(component.selectionError).toContain('PDF');
  });
});

function fileEvent(file: File): Event {
  return {
    target: { files: [file], value: 'selected' },
  } as unknown as Event;
}
