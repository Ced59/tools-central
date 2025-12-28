import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  inject,
  PLATFORM_ID, NgZone, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

type ShareContext = 'tool' | 'category' | 'home' | 'generic';

type ShareNetworkId =
  | 'copy'
  | 'email'
  | 'whatsapp'
  | 'telegram'
  | 'linkedin'
  | 'facebook'
  | 'x'
  | 'reddit'
  | 'line'
  | 'vk'
  | 'wechat_qr';

type Region = 'GLOBAL' | 'EU_US' | 'CN' | 'JP' | 'KR' | 'RU_CIS';

interface ShareNetwork {
  id: ShareNetworkId;
  label: string;
  icon: string; // PrimeIcons class (pi pi-*)
  regions: Region[];
  buildUrl?: (url: string, title: string, text: string) => string;
  kind: 'link' | 'action';
}

@Component({
  selector: 'app-social-share',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-share.component.html',
  styleUrls: ['./social-share.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialShareComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);

  private qrPromise: Promise<void> | null = null;
  private qrForUrl: string | null = null;

  @Input() context: ShareContext = 'generic';

  /**
   * Optionnel : si tu veux forcer un titre/texte.
   * Sinon on dérive de document.title.
   */
  @Input() shareTitle?: string;
  @Input() shareText?: string;

  /**
   * Si tu veux forcer l’URL (sinon on prend l’URL canonique actuelle)
   */
  @Input() shareUrl?: string;

  /**
   * Afficher le QR (utile pour WeChat / mobile). Géré sans tracking.
   */
  @Input() enableQr = true;

  /**
   * État UI
   */
  public canNativeShare = false;
  public copied = false;
  public showMore = false;
  public showQr = false;

  public resolvedUrl = '';
  public resolvedTitle = '';
  public resolvedText = '';

  public primaryNetworks: ShareNetwork[] = [];
  public moreNetworks: ShareNetwork[] = [];

  public qrDataUrl: string | null = null;
  public qrLoading = false;
  public qrError = false;

  private readonly networks: ShareNetwork[] = [
    // Actions locales
    {
      id: 'copy',
      label: $localize`:@@share_copy:Copier le lien`,
      icon: 'pi pi-copy',
      regions: ['GLOBAL', 'EU_US', 'CN', 'JP', 'KR', 'RU_CIS'],
      kind: 'action',
    },
    {
      id: 'wechat_qr',
      label: $localize`:@@share_wechat_qr:QR code (WeChat)`,
      icon: 'pi pi-qrcode',
      regions: ['CN'],
      kind: 'action',
    },

    // Partage via URLs (sans SDK)
    {
      id: 'email',
      label: $localize`:@@share_email:Email`,
      icon: 'pi pi-envelope',
      regions: ['GLOBAL', 'EU_US', 'CN', 'JP', 'KR', 'RU_CIS'],
      kind: 'link',
      buildUrl: (url, title, text) => {
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(text ? `${text}\n\n${url}` : url);
        return `mailto:?subject=${subject}&body=${body}`;
      },
    },
    {
      id: 'whatsapp',
      label: $localize`:@@share_whatsapp:WhatsApp`,
      icon: 'pi pi-whatsapp',
      regions: ['GLOBAL', 'EU_US', 'JP', 'KR', 'RU_CIS'],
      kind: 'link',
      buildUrl: (url, _title, text) => {
        const msg = encodeURIComponent(text ? `${text} ${url}` : url);
        return `https://wa.me/?text=${msg}`;
      },
    },
    {
      id: 'telegram',
      label: $localize`:@@share_telegram:Telegram`,
      icon: 'pi pi-send',
      regions: ['GLOBAL', 'EU_US', 'RU_CIS'],
      kind: 'link',
      buildUrl: (url, title, text) => {
        const u = encodeURIComponent(url);
        const t = encodeURIComponent(text || title);
        return `https://t.me/share/url?url=${u}&text=${t}`;
      },
    },
    {
      id: 'linkedin',
      label: $localize`:@@share_linkedin:LinkedIn`,
      icon: 'pi pi-linkedin',
      regions: ['EU_US'],
      kind: 'link',
      buildUrl: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      id: 'facebook',
      label: $localize`:@@share_facebook:Facebook`,
      icon: 'pi pi-facebook',
      regions: ['EU_US'],
      kind: 'link',
      buildUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      id: 'x',
      label: $localize`:@@share_x:X`,
      icon: 'pi pi-twitter',
      regions: ['EU_US', 'GLOBAL'],
      kind: 'link',
      buildUrl: (url, _title, text) => {
        const u = encodeURIComponent(url);
        const t = encodeURIComponent(text || '');
        return `https://twitter.com/intent/tweet?url=${u}${t ? `&text=${t}` : ''}`;
      },
    },
    {
      id: 'reddit',
      label: $localize`:@@share_reddit:Reddit`,
      icon: 'pi pi-reddit',
      regions: ['EU_US'],
      kind: 'link',
      buildUrl: (url, title) =>
        `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    },
    {
      id: 'line',
      label: $localize`:@@share_line:LINE`,
      icon: 'pi pi-comments',
      regions: ['JP'],
      kind: 'link',
      buildUrl: (url) => `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
    },
    {
      id: 'vk',
      label: $localize`:@@share_vk:VK`,
      icon: 'pi pi-users',
      regions: ['RU_CIS'],
      kind: 'link',
      buildUrl: (url, title) =>
        `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    },
  ];

  ngOnInit(): void {
    // SSR-safe init
    this.refreshResolvedData();

    // Met à jour l’URL lors des navigations SPA
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        const wasOpen = this.showQr;

        this.refreshResolvedData();

        this.copied = false;
        this.qrError = false;
        this.qrLoading = false;

        // reset QR cache
        this.qrDataUrl = null;
        this.qrForUrl = null;
        this.qrPromise = null;

        // ✅ Si le panneau QR était ouvert, on le garde ouvert et on régénère
        if (wasOpen && this.enableQr) {
          this.showQr = true;

          // On lance une génération "propre"
          this.qrPromise = this.generateQr();
          this.qrPromise.finally(() => (this.qrPromise = null));
        } else {
          this.showQr = false;
        }

        this.cdr.markForCheck();
      });
  }

  public get heading(): string {
    // Accroche adaptée au contexte global
    switch (this.context) {
      case 'tool':
        return $localize`:@@share_heading_tool:Partager cet outil`;
      case 'category':
        return $localize`:@@share_heading_category:Partager cette catégorie`;
      case 'home':
        return $localize`:@@share_heading_home:Partager Tools Central`;
      default:
        return $localize`:@@share_heading_generic:Partager cette page`;
    }
  }

  public get subheading(): string {
    switch (this.context) {
      case 'tool':
        return $localize`:@@share_sub_tool:Vous pensez que ce calculateur peut aider quelqu’un ?`;
      case 'category':
        return $localize`:@@share_sub_category:Vous connaissez quelqu’un qui cherche ce type d’outils ?`;
      case 'home':
        return $localize`:@@share_sub_home:Merci de faire connaître le site 🙂`;
      default:
        return $localize`:@@share_sub_generic:Envoyez le lien en un clic.`;
    }
  }

  public async onNativeShare(): Promise<void> {
    if (!this.isBrowser() || !this.canNativeShare) return;

    try {
      await navigator.share({
        title: this.resolvedTitle,
        text: this.resolvedText || undefined,
        url: this.resolvedUrl,
      });
    } catch {
      // L’utilisateur peut annuler : on ignore
    }
  }

  public async onCopy(): Promise<void> {
    if (!this.isBrowser()) return;

    const url = this.resolvedUrl;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback old-school
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.copied = true;
      window.setTimeout(() => (this.copied = false), 1500);
    } catch {
      // On ne bloque pas l’UI
      this.copied = false;
    }
  }

  public openNetwork(net: ShareNetwork): void {
    if (net.kind !== 'link' || !net.buildUrl) return;
    if (!this.isBrowser()) return;

    const href = net.buildUrl(this.resolvedUrl, this.resolvedTitle, this.resolvedText);
    window.open(href, '_blank', 'noopener,noreferrer');
  }

  public toggleMore(): void {
    this.showMore = !this.showMore;
  }

  public async toggleQr(): Promise<void> {
    if (!this.enableQr) return;

    this.showQr = !this.showQr;
    if (!this.showQr) return;

    // Si déjà généré pour la même URL, rien à faire
    if (this.qrDataUrl && this.qrForUrl === this.resolvedUrl) return;

    // Si une génération est déjà en cours, on attend juste
    if (this.qrPromise) {
      try { await this.qrPromise; } catch { /* ignore */ }
      return;
    }

    this.qrPromise = this.generateQr();
    try {
      await this.qrPromise;
    } finally {
      this.qrPromise = null;
    }
  }

  private refreshResolvedData(): void {
    if (!this.isBrowser()) {
      // SSR: on met des placeholders sans accéder à window/document.
      this.resolvedUrl = this.shareUrl ?? '';
      this.resolvedTitle = this.shareTitle ?? 'Tools Central';
      this.resolvedText = this.shareText ?? '';
      this.canNativeShare = false;
      this.computeNetworks('GLOBAL');
      return;
    }

    this.resolvedUrl = this.shareUrl ?? this.getCanonicalOrCurrentUrl();
    this.resolvedTitle = this.shareTitle ?? (document?.title || 'Tools Central');
    this.resolvedText = this.shareText ?? '';

    // Native share support
    this.canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    const region = this.detectRegion();
    this.computeNetworks(region);
  }

  private computeNetworks(region: Region): void {
    const primaryIds: ShareNetworkId[] = this.canNativeShare
      ? ['copy'] // si share natif dispo, on garde l’UI légère
      : ['copy', 'email'];

    // réseaux “promus” selon région (en plus des actions)
    const regionPromoted: Record<Region, ShareNetworkId[]> = {
      GLOBAL: ['whatsapp', 'telegram', 'x'],
      EU_US: ['linkedin', 'facebook', 'x', 'reddit'],
      CN: ['wechat_qr', 'email'],
      JP: ['line', 'x', 'email'],
      KR: ['x', 'email'],
      RU_CIS: ['vk', 'telegram', 'email'],
    };

    const promoted = regionPromoted[region] ?? regionPromoted.GLOBAL;

    const available = this.networks.filter(n => n.regions.includes(region) || n.regions.includes('GLOBAL'));

    // Primary = actions + quelques réseaux
    const primary = new Map<ShareNetworkId, ShareNetwork>();
    for (const id of primaryIds) {
      const n = available.find(x => x.id === id);
      if (n) primary.set(id, n);
    }
    for (const id of promoted) {
      const n = available.find(x => x.id === id);
      if (n) primary.set(id, n);
      if (primary.size >= 5) break;
    }

    // More = le reste (tri stable)
    const primarySet = new Set([...primary.keys()]);
    const more = available.filter(n => !primarySet.has(n.id) && n.id !== 'wechat_qr');

    this.primaryNetworks = [...primary.values()];
    this.moreNetworks = more;
  }

  private detectRegion(): Region {
    if (!this.isBrowser()) return 'GLOBAL';

    const lang = (navigator.language || '').toLowerCase();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';

    // Chine
    if (lang.startsWith('zh') || tz.includes('Shanghai') || tz.includes('Beijing')) return 'CN';

    // Japon
    if (lang.startsWith('ja') || tz.includes('Tokyo')) return 'JP';

    // Corée
    if (lang.startsWith('ko') || tz.includes('Seoul')) return 'KR';

    // Russie/CIS (heuristique simple)
    if (lang.startsWith('ru') || tz.includes('Moscow')) return 'RU_CIS';

    // EU/US par défaut si langue “occidentale” (heuristique)
    const euUsLangs = ['en', 'fr', 'de', 'es', 'it', 'nl', 'pt', 'sv', 'da', 'no', 'fi', 'pl', 'cs', 'sk', 'ro', 'hu', 'el', 'tr', 'uk', 'bg'];
    if (euUsLangs.some(p => lang.startsWith(p))) return 'EU_US';

    return 'GLOBAL';
  }

  private getCanonicalOrCurrentUrl(): string {
    try {
      const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
      if (canonical) return canonical;
      return window.location.href;
    } catch {
      return '';
    }
  }

  private async generateQr(): Promise<void> {
    // On passe en "loading" DANS la zone Angular
    this.zone.run(() => {
      this.qrLoading = true;
      this.qrError = false;
      this.cdr.markForCheck();
    });

    const url = this.resolvedUrl;

    try {
      if (!url) throw new Error('Missing URL');

      // Import + calcul hors zone (perf), puis on revient dans la zone pour MAJ l'UI
      const mod = await import('qrcode');
      const dataUrl = await mod.toDataURL(url, {
        margin: 1,
        scale: 6,
        errorCorrectionLevel: 'M',
      });

      this.zone.run(() => {
        this.qrDataUrl = dataUrl;
        this.qrForUrl = url;
        this.qrLoading = false;
        this.qrError = false;
        this.cdr.markForCheck();
      });
    } catch {
      this.zone.run(() => {
        this.qrDataUrl = null;
        this.qrForUrl = null;
        this.qrLoading = false;
        this.qrError = true;
        this.cdr.markForCheck();
      });
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
