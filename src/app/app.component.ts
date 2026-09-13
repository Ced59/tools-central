import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

import { ThemeService } from './services/theme.service';
import { SeoAutoService } from './services/seo/seo-auto.service';
import { LOCALES, type LocaleOption } from './i18n/locales.generated';
import { LocalePathService } from './services/locale-path.service';
import { SocialShareComponent } from './components/shared/social-share/social-share.component';

type ShareContext = 'tool' | 'category' | 'home' | 'generic';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    NgOptimizedImage,
    SocialShareComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('appHeader', { static: true }) headerRef!: ElementRef<HTMLElement>;

  themeService = inject(ThemeService);
  seoAuto = inject(SeoAutoService);
  localePath = inject(LocalePathService);
  router = inject(Router);

  private platformId = inject(PLATFORM_ID);
  private resizeHandler?: () => void;

  year = new Date().getFullYear();

  localeOptions: LocaleOption[] = [...LOCALES];
  selectedLocale!: LocaleOption;

  homeHref = '/fr/';
  shareContext: ShareContext = 'generic';

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        const url = this.router.url || '';
        if (url === '/' || url === '/fr' || url === '/en') this.shareContext = 'home';
        else if (url.includes('/categories/')) this.shareContext = 'category';
        else if (url.includes('/tools/') || url.includes('/tool/')) this.shareContext = 'tool';
        else this.shareContext = 'generic';
      });
  }

  ngOnInit() {
    this.seoAuto.init();

    // SSR: fallback simple
    if (!isPlatformBrowser(this.platformId)) {
      this.selectedLocale = LOCALES[0];
      this.homeHref = `/${this.selectedLocale.locale}/`;
      return;
    }

    const firstSegment = (location.pathname.split('/').filter(Boolean)[0] ?? 'fr');
    this.selectedLocale = LOCALES.find(l => l.locale === firstSegment) ?? LOCALES[0];
    this.homeHref = `/${this.selectedLocale.locale}/`;
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const applyHeaderHeightVar = () => {
      const h = this.headerRef?.nativeElement?.getBoundingClientRect().height ?? 0;
      document.documentElement.style.setProperty('--app-header-h', `${Math.ceil(h)}px`);
    };

    applyHeaderHeightVar();

    const onResize = () => applyHeaderHeightVar();
    window.addEventListener('resize', onResize, { passive: true });

    this.resizeHandler = () => window.removeEventListener('resize', onResize);
  }

  ngOnDestroy(): void {
    this.resizeHandler?.();
  }

  onLocaleChange(locale: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    const option = LOCALES.find((candidate) => candidate.locale === locale);
    if (!option) return;

    this.selectedLocale = option;
    this.homeHref = `/${option.locale}/`;

    const nextPath = this.localePath.switchLocale(location.pathname, option.locale);

    // conserve query + hash
    const nextUrl = nextPath + location.search + location.hash;

    location.assign(nextUrl);
  }
}
