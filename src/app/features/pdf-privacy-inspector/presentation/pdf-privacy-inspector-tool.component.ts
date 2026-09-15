import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  LOCALE_ID,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  DownloadPdfPrivacyReportUseCase,
  InspectPdfPrivacyUseCase,
  PDF_PRIVACY_MAX_FILE_BYTES,
  PdfPrivacyValidationError,
  type PdfPrivacyAttentionLevel,
  type PdfPrivacyCategory,
  type PdfPrivacyFinding,
  type PdfPrivacyFindingKind,
  type PdfPrivacyFindingMessage,
  type PdfPrivacyReport,
  type PdfPrivacySeverity,
} from '../application/pdf-privacy.use-cases';
import { BrowserPdfPrivacyFileReaderAdapter } from '../infrastructure/browser-pdf-privacy-file-reader.adapter';
import { BrowserPdfPrivacyReportDownloadAdapter } from '../infrastructure/browser-pdf-privacy-report-download.adapter';
import { PdfPrivacyWorkerAdapter } from '../infrastructure/pdf-privacy-worker.adapter';

type ToolState = 'idle' | 'ready' | 'processing' | 'done' | 'error';
type CategoryFilter = 'all' | PdfPrivacyCategory;

const CATEGORY_ORDER: readonly PdfPrivacyCategory[] = [
  'active-content', 'attachments', 'links', 'forms', 'metadata', 'signatures', 'encryption',
];

@Component({
  selector: 'app-pdf-privacy-inspector-tool',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pdf-privacy-inspector-tool.component.html',
  styleUrl: './pdf-privacy-inspector-tool.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfPrivacyInspectorToolComponent {
  private readonly inspectUseCase = new InspectPdfPrivacyUseCase(
    new BrowserPdfPrivacyFileReaderAdapter(),
    new PdfPrivacyWorkerAdapter(),
  );
  private readonly downloadUseCase = new DownloadPdfPrivacyReportUseCase(
    new BrowserPdfPrivacyReportDownloadAdapter(),
  );
  private readonly locale = inject(LOCALE_ID);
  private taskRevision = 0;
  private abortController: AbortController | null = null;

  readonly maxFileSizeLabel = formatBytes(PDF_PRIVACY_MAX_FILE_BYTES, this.locale);
  readonly state = signal<ToolState>('idle');
  readonly file = signal<File | null>(null);
  readonly password = signal('');
  readonly passwordRequired = signal(false);
  readonly progress = signal(0);
  readonly result = signal<PdfPrivacyReport | null>(null);
  readonly errorMessage = signal('');
  readonly selectedCategory = signal<CategoryFilter>('all');
  readonly isBusy = computed(() => this.state() === 'processing');
  readonly canInspect = computed(() => this.file() !== null && !this.isBusy());
  readonly availableCategories = computed(() => {
    const report = this.result();
    return report
      ? CATEGORY_ORDER.filter(category => report.categoryCounts[category] > 0)
      : [];
  });
  readonly visibleFindings = computed(() => {
    const report = this.result();
    if (!report) return [];
    const category = this.selectedCategory();
    return category === 'all'
      ? report.findings
      : report.findings.filter(finding => finding.category === category);
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.cancelCurrentTask();
    });
  }

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0] ?? null;
    input.value = '';
    if (!selected) return;
    this.taskRevision += 1;
    this.cancelCurrentTask();
    this.file.set(selected);
    this.password.set('');
    this.passwordRequired.set(false);
    this.result.set(null);
    this.errorMessage.set('');
    this.progress.set(0);
    this.selectedCategory.set('all');
    this.state.set('ready');
  }

  updatePassword(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
    this.invalidateResult();
  }

  async inspect(): Promise<void> {
    const file = this.file();
    if (!file || !this.canInspect()) return;
    const password = this.password();
    this.password.set('');
    const revision = ++this.taskRevision;
    this.cancelCurrentTask();
    const controller = new AbortController();
    this.abortController = controller;
    this.result.set(null);
    this.errorMessage.set('');
    this.progress.set(0);
    this.selectedCategory.set('all');
    this.state.set('processing');
    try {
      const report = await this.inspectUseCase.execute({
        source: { fileName: file.name, size: file.size, blob: file },
        password,
        onProgress: percent => {
          if (revision === this.taskRevision) this.progress.set(percent);
        },
        signal: controller.signal,
      });
      if (revision !== this.taskRevision) return;
      this.result.set(report);
      this.progress.set(100);
      this.passwordRequired.set(false);
      this.state.set('done');
    } catch (error: unknown) {
      if (revision === this.taskRevision && !isAbortError(error)) {
        if (error instanceof PdfPrivacyValidationError && (
          error.code === 'password-required' || error.code === 'incorrect-password'
        )) this.passwordRequired.set(true);
        this.errorMessage.set(this.describeError(error));
        this.state.set('error');
      }
    } finally {
      if (this.abortController === controller) this.abortController = null;
    }
  }

  cancel(): void {
    this.taskRevision += 1;
    this.cancelCurrentTask();
    this.progress.set(0);
    this.state.set(this.file() ? 'ready' : 'idle');
  }

  selectCategory(category: CategoryFilter): void {
    this.selectedCategory.set(category);
  }

  downloadReport(): void {
    const file = this.file();
    const report = this.result();
    if (file && report) this.downloadUseCase.execute(file.name, file.size, report);
  }

  reset(): void {
    this.taskRevision += 1;
    this.cancelCurrentTask();
    this.file.set(null);
    this.password.set('');
    this.passwordRequired.set(false);
    this.progress.set(0);
    this.result.set(null);
    this.errorMessage.set('');
    this.selectedCategory.set('all');
    this.state.set('idle');
  }

  categoryLabel(category: PdfPrivacyCategory): string {
    const labels: Readonly<Record<PdfPrivacyCategory, string>> = {
      metadata: $localize`:@@pdf_privacy_category_metadata:Métadonnées`,
      'active-content': $localize`:@@pdf_privacy_category_active:Contenu actif`,
      attachments: $localize`:@@pdf_privacy_category_attachments:Pièces jointes`,
      links: $localize`:@@pdf_privacy_category_links:Liens externes`,
      forms: $localize`:@@pdf_privacy_category_forms:Formulaires`,
      signatures: $localize`:@@pdf_privacy_category_signatures:Signatures`,
      encryption: $localize`:@@pdf_privacy_category_encryption:Chiffrement`,
    };
    return labels[category];
  }

  findingTitle(kind: PdfPrivacyFindingKind): string {
    const labels: Readonly<Record<PdfPrivacyFindingKind, string>> = {
      'document-metadata': $localize`:@@pdf_privacy_finding_document_metadata:Métadonnée du document`,
      'xmp-metadata': $localize`:@@pdf_privacy_finding_xmp_metadata:Métadonnée XMP`,
      javascript: $localize`:@@pdf_privacy_finding_javascript:JavaScript embarqué`,
      'automatic-action': $localize`:@@pdf_privacy_finding_automatic_action:Action automatique`,
      'embedded-file': $localize`:@@pdf_privacy_finding_embedded_file:Fichier embarqué`,
      'external-link': $localize`:@@pdf_privacy_finding_external_link:Lien externe`,
      'form-fields': $localize`:@@pdf_privacy_finding_form_fields:Champs de formulaire`,
      'xfa-form': $localize`:@@pdf_privacy_finding_xfa_form:Formulaire XFA dynamique`,
      'digital-signature': $localize`:@@pdf_privacy_finding_signature:Signature numérique`,
      encryption: $localize`:@@pdf_privacy_finding_encryption:Protection du PDF`,
    };
    return labels[kind];
  }

  severityLabel(severity: PdfPrivacySeverity): string {
    if (severity === 'high') return $localize`:@@pdf_privacy_severity_high:Attention forte`;
    if (severity === 'medium') return $localize`:@@pdf_privacy_severity_medium:À vérifier`;
    if (severity === 'low') return $localize`:@@pdf_privacy_severity_low:Trace trouvée`;
    return $localize`:@@pdf_privacy_severity_info:Information`;
  }

  attentionLabel(level: PdfPrivacyAttentionLevel): string {
    if (level === 'high') return $localize`:@@pdf_privacy_attention_high:Attention forte`;
    if (level === 'medium') return $localize`:@@pdf_privacy_attention_medium:Vérifications nécessaires`;
    if (level === 'low') return $localize`:@@pdf_privacy_attention_low:Traces de confidentialité détectées`;
    return $localize`:@@pdf_privacy_attention_clear:Aucune trace prise en charge détectée`;
  }

  encryptionLabel(report: PdfPrivacyReport): string {
    return report.encrypted
      ? $localize`:@@pdf_privacy_encrypted_label:protégé et déchiffré localement`
      : $localize`:@@pdf_privacy_unencrypted_label:non chiffré`;
  }

  findingContext(finding: PdfPrivacyFinding): string {
    const parts: string[] = [];
    if (finding.label) parts.push(finding.label);
    const message = this.findingMessage(finding.message);
    if (message) parts.push(message);
    if (finding.pageNumber) parts.push($localize`:@@pdf_privacy_page_context:Page ${finding.pageNumber}:pageNumber:`);
    if ((finding.occurrences ?? 0) > 1) {
      parts.push($localize`:@@pdf_privacy_occurrences_context:${finding.occurrences}:count: occurrence(s)`);
    }
    if (finding.bytes !== undefined) parts.push(formatBytes(finding.bytes, this.locale));
    return parts.join(' · ');
  }

  findingMessage(message: PdfPrivacyFindingMessage | undefined): string {
    if (!message) return '';
    switch (message.code) {
      case 'form-actions-undetailed':
      case 'form-actions':
        return this.findingTitle('javascript');
      case 'outline-link':
      case 'annotation-link':
        return this.findingTitle('external-link');
      case 'document-permissions':
        return `${this.findingTitle('encryption')} · ${new Intl.NumberFormat(this.locale).format(message.count)}`;
      case 'document-password':
        return this.findingTitle('encryption');
      case 'unnamed-attachment':
        return `${this.findingTitle('embedded-file')} ${new Intl.NumberFormat(this.locale).format(message.index)}`;
      case 'open-action':
        return `OpenAction`;
      case 'acroform-summary':
        return `${this.findingTitle('form-fields')} · ${new Intl.NumberFormat(this.locale).format(message.populatedCount)}/${new Intl.NumberFormat(this.locale).format(message.fieldCount)}`;
      case 'xfa-form':
        return this.findingTitle('xfa-form');
      case 'signature-details':
        return this.signatureMessage(message);
      case 'interactive-sound':
        return `${this.findingTitle('automatic-action')} · Sound`;
      case 'interactive-video':
        return `${this.findingTitle('automatic-action')} · Video`;
      case 'interactive-screen':
        return `${this.findingTitle('automatic-action')} · Screen`;
      case 'interactive-3d':
        return `${this.findingTitle('automatic-action')} · 3D`;
      case 'rich-media':
        return `${this.findingTitle('automatic-action')} · RichMedia`;
      case 'annotated-attachment':
        return this.findingTitle('embedded-file');
      case 'unsafe-external-target':
        return this.findingTitle('automatic-action');
      case 'named-action':
        return this.findingTitle('automatic-action');
      case 'attachment-opening':
        return this.findingTitle('embedded-file');
      case 'dictionary-action':
        if (message.context === 'open-action') return `OpenAction · ${message.actionType}`;
        if (message.context === 'additional-action') return `AA · ${message.actionType}`;
        if (message.context === 'chained-action') return `Next · ${message.actionType}`;
        return message.actionType;
    }
  }

  formatFileSize(value: number): string {
    return formatBytes(value, this.locale);
  }

  private invalidateResult(): void {
    this.result.set(null);
    this.errorMessage.set('');
    this.progress.set(0);
    if (!this.isBusy()) this.state.set(this.file() ? 'ready' : 'idle');
  }

  private cancelCurrentTask(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  private signatureMessage(message: Extract<PdfPrivacyFindingMessage, { code: 'signature-details' }>): string {
    const parts = [
      `${this.findingTitle('digital-signature')} ${new Intl.NumberFormat(this.locale).format(message.index)}`,
    ];
    if (message.subFilter) parts.push(message.subFilter);
    if (message.coversWholeDocument === true) parts.push('100 %');
    else if (message.coversWholeDocument === false) parts.push('< 100 %');
    if (message.modifications) {
      parts.push(`Δ ${new Intl.NumberFormat(this.locale).format(message.modifications)}`);
    }
    return parts.join(' · ');
  }

  private describeError(error: unknown): string {
    if (error instanceof PdfPrivacyValidationError) {
      if (error.code === 'empty-file') return $localize`:@@pdf_privacy_error_empty:Le fichier sélectionné est vide.`;
      if (error.code === 'file-too-large') return $localize`:@@pdf_privacy_error_size:Le fichier dépasse la limite de ${this.maxFileSizeLabel}:limit:.`;
      if (error.code === 'unsupported-format') return $localize`:@@pdf_privacy_error_format:Sélectionnez un fichier portant l’extension PDF.`;
      if (error.code === 'password-too-long') return $localize`:@@pdf_privacy_error_password_length:Le mot de passe dépasse la limite de sécurité de 128 caractères.`;
      if (error.code === 'password-required') return $localize`:@@pdf_privacy_error_password_required:Ce PDF est protégé. Saisissez son mot de passe pour poursuivre l’inspection locale.`;
      if (error.code === 'incorrect-password') return $localize`:@@pdf_privacy_error_password_incorrect:Le mot de passe ne permet pas d’ouvrir ce PDF.`;
      if (error.code === 'too-many-pages') return $localize`:@@pdf_privacy_error_pages:Le document dépasse la limite de 1 000 pages inspectables.`;
      if (error.code === 'inspection-limit') return $localize`:@@pdf_privacy_error_limit:Le document contient trop d’éléments distincts pour produire un rapport fiable dans les limites locales.`;
      if (error.code === 'invalid-pdf') return $localize`:@@pdf_privacy_error_invalid:Le fichier ne contient pas une structure PDF valide.`;
    }
    return $localize`:@@pdf_privacy_error_generic:Impossible d’inspecter ce PDF. Il peut être endommagé ou utiliser une fonctionnalité non prise en charge.`;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function formatBytes(value: number, locale: string): string {
  if (value < 1_024) return `${String(value)} o`;
  const units = ['Kio', 'Mio', 'Gio'];
  let current = value / 1_024;
  let index = 0;
  while (current >= 1_024 && index < units.length - 1) {
    current /= 1_024;
    index += 1;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(current)} ${units[index]}`;
}
