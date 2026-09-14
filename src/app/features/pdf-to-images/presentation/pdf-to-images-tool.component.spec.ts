import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { PdfToImagesToolComponent } from './pdf-to-images-tool.component';

describe('PdfToImagesToolComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfToImagesToolComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders an accessible, local-first empty state', () => {
    const fixture = TestBed.createComponent(PdfToImagesToolComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Convertir un PDF en images');
    expect(element.querySelector('input[type="file"]')?.getAttribute('accept')).toContain('application/pdf');
    expect(element.textContent).toContain('Aucun envoi');
    expect((element.querySelector('.primary-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('labels page-selection errors precisely', () => {
    const component = TestBed.createComponent(PdfToImagesToolComponent).componentInstance;
    component.documentSummary.set({
      pageCount: 3,
      pages: Array.from({ length: 3 }, (_, index) => ({ pageNumber: index + 1, widthPoints: 72, heightPoints: 72, rotation: 0 })),
    });
    component.pageSelection.set('4');
    expect(component.selectionErrorLabel()).toContain('sort du document');
  });
});
