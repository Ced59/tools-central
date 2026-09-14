import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SoftwareApplicationSchemaBuilderToolComponent } from './software-application-schema-builder-tool.component';

describe('SoftwareApplicationSchemaBuilderToolComponent', () => {
  let fixture: ComponentFixture<SoftwareApplicationSchemaBuilderToolComponent>;
  let component: SoftwareApplicationSchemaBuilderToolComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoftwareApplicationSchemaBuilderToolComponent],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'fr-FR' }],
    }).compileComponents();
    fixture = TestBed.createComponent(SoftwareApplicationSchemaBuilderToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('génère par défaut un JSON-LD valide sans inventer de note', () => {
    expect(component.result().state).toBe('schema-valid');
    expect(component.result().issues).toContainEqual(expect.objectContaining({ code: 'missing-aggregate-rating' }));
    expect(component.activeOutput()).toContain('<script type="application/ld+json">');
  });

  it('passe à un résultat Google complet lorsque la note réelle est activée', () => {
    component.includeAggregateRating.set(true);

    expect(component.result().state).toBe('google-ready');
    expect(component.activeOutput()).toContain('"aggregateRating"');
  });

  it('bloque les sorties lorsque le formulaire contient une erreur', () => {
    component.name.set('');

    expect(component.result().state).toBe('invalid');
    expect(component.activeOutput()).toBe('');
  });

  it('change de format puis restaure tous les champs par défaut', () => {
    component.setOutputFormat('jsonLd');
    component.name.set('Autre');
    component.includeAggregateRating.set(true);
    component.reset();

    expect(component.outputFormat()).toBe('scriptTag');
    expect(component.name()).toBe('Planificateur de projet');
    expect(component.includeAggregateRating()).toBe(false);
  });

  it('formate les compteurs selon la locale active', () => {
    expect(component.formatNumber(12_345)).toBe(new Intl.NumberFormat('fr-FR').format(12_345));
  });

  it('annonce un refus du presse-papiers dans une zone dynamique accessible', async () => {
    const copyUseCase = (component as unknown as {
      copyUseCase: { execute(content: string): Promise<boolean> };
    }).copyUseCase;
    vi.spyOn(copyUseCase, 'execute').mockResolvedValue(false);

    await component.copyOutput();
    fixture.detectChanges();

    expect(component.copyFailed()).toBe(true);
    const feedback = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.copy-feedback');
    expect(feedback?.getAttribute('role')).toBe('status');
    expect(feedback?.textContent).toContain('Copie automatique impossible');
  });

  it('conserve un code de devise trop long pour que le domaine le refuse', () => {
    const input = document.createElement('input');
    input.value = 'USDT';
    input.addEventListener('input', event => {
      component.updatePriceCurrency(event);
    });

    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(component.priceCurrency()).toBe('USDT');
    expect(component.result().issues).toContainEqual(expect.objectContaining({
      code: 'invalid-price-currency',
      detail: 'USDT',
    }));
  });

  it('garde le JSON généré hors des zones annoncées automatiquement', () => {
    const host = fixture.nativeElement as HTMLElement;
    const output = host.querySelector<HTMLElement>('[data-testid="software-schema-output"]');
    const health = host.querySelector<HTMLElement>('.health[role="status"]');

    expect(output?.closest('[aria-live]')).toBeNull();
    expect(health?.getAttribute('aria-live')).toBe('polite');
    expect(health?.getAttribute('aria-atomic')).toBe('true');
    expect(health?.textContent).not.toContain(component.activeOutput());
  });

  it('décrit la syntaxe décimale réellement acceptée dans le diagnostic de prix', () => {
    const label = component.issueLabel('invalid-price');

    expect(label).toContain('un point ou une virgule');
    expect(label).not.toContain('deux décimales');
  });
});
