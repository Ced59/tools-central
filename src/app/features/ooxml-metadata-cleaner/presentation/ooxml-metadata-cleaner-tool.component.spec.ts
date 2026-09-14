import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OoxmlMetadataCleanerToolComponent } from './ooxml-metadata-cleaner-tool.component';

describe('OoxmlMetadataCleanerToolComponent', () => {
  let fixture: ComponentFixture<OoxmlMetadataCleanerToolComponent>;
  let component: OoxmlMetadataCleanerToolComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [OoxmlMetadataCleanerToolComponent] }).compileComponents();
    fixture = TestBed.createComponent(OoxmlMetadataCleanerToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('selects one supported source and enables cleaning', () => {
    const file = new File(['zip'], 'rapport.docx', { type: 'application/octet-stream' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });
    component.selectFile({ target: input } as unknown as Event);
    expect(component.file()).toBe(file);
    expect(component.state()).toBe('ready');
    expect(component.canClean()).toBe(true);
  });

  it('disables cleaning when every option is unchecked', () => {
    const file = new File(['zip'], 'rapport.xlsx');
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });
    component.selectFile({ target: input } as unknown as Event);
    for (const name of Object.keys(component.options()) as Array<keyof ReturnType<typeof component.options>>) {
      const checkbox = document.createElement('input');
      checkbox.checked = false;
      component.updateOption(name, { target: checkbox } as unknown as Event);
    }
    expect(component.canClean()).toBe(false);
  });

  it('exposes a completed before/after report and resets it', async () => {
    const file = new File(['zip'], 'presentation.pptx');
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });
    component.selectFile({ target: input } as unknown as Event);
    vi.spyOn(component['cleanUseCase'], 'execute').mockResolvedValue({
      blob: new Blob(['clean']),
      fileName: 'presentation-sans-metadonnees.pptx',
      report: {
        kind: 'pptx',
        detected: [{ scope: 'core', name: 'creator', value: 'Alice', path: 'docProps/core.xml' }],
        removed: [{ scope: 'core', name: 'creator', value: 'Alice', path: 'docProps/core.xml' }],
        remaining: [],
        detectedCount: 1,
        removedCount: 1,
        remainingCount: 0,
        truncatedFindingCount: 0,
        archiveEntryCount: 4,
        uncompressedBytes: 20,
      },
    });
    await component.clean();
    fixture.detectChanges();
    expect(component.state()).toBe('done');
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="ooxml-metadata-result"]')).not.toBeNull();
    component.reset();
    expect(component.file()).toBeNull();
    expect(component.result()).toBeNull();
  });
});
