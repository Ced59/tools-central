import { Component, inject, PLATFORM_ID } from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ThemeService } from './services/theme.service';
import { SeoService } from './services/seo/seo.service';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { LOCALES, type LocaleOption } from './i18n/locales.generated';
import {LocalePathService} from "./services/local-path.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ButtonModule, NgOptimizedImage, FormsModule, SelectModule],
  template: `
    <div class="app-root">
      <header class="app-header">
        <div class="header-inner container">
          <a [attr.href]="homeHref" class="brand" aria-label="Tools Central">
            <img ngSrc="/assets/icons/tools.png" alt="" class="brand-icon" width="32" height="32" priority />
            <span class="brand-text">Tools Central</span>
          </a>

          <div class="header-actions">
            <p-select
              [options]="localeOptions"
              [(ngModel)]="selectedLocale"
              optionLabel="nameNative"
              [filter]="true"
              filterBy="nameNative,locale"
              (onChange)="onLocaleChange(selectedLocale)"
              aria-label="Language"
              i18n-aria-label="@@lang_switcher_aria"
            >
              <ng-template pTemplate="selectedItem" let-item>
                <div class="lang-item">
                  <img class="flag" [src]="'/assets/flags/' + item.flag + '.svg'" width="18" height="14" alt="" />
                  <span class="lang-text">{{ item.nameNative }}</span>
                </div>
              </ng-template>

              <ng-template pTemplate="item" let-item>
                <div class="lang-item">
                  <img class="flag" [src]="'/assets/flags/' + item.flag + '.svg'" width="18" height="14" alt="" />
                  <span class="lang-text">{{ item.nameNative }}</span>
                  <span class="lang-locale">{{ item.locale }}</span>
                </div>
              </ng-template>
            </p-select>

            <p-button
              [icon]="themeService.isDarkMode() ? 'pi pi-sun' : 'pi pi-moon'"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              (onClick)="themeService.toggleTheme()"
              [attr.aria-label]="themeService.isDarkMode()
                ? 'Activer le mode clair'
                : 'Activer le mode sombre'"
              i18n-attr.aria-label="@@aria_light_mode"
            />
          </div>
        </div>
      </header>

      <main class="app-main">
        <router-outlet></router-outlet>
      </main>

      <footer class="app-footer">
        <div class="container footer-inner">
          <div class="footer-links" aria-label="Legal">
            <a [routerLink]="localePath.link('legal-notice')" class="footer-link" i18n="@@footer_legal_notice">
              Mentions légales
            </a>

            <span class="footer-sep" aria-hidden="true">•</span>

            <a [routerLink]="localePath.link('privacy-policy')" class="footer-link" i18n="@@footer_privacy">
              Politique de confidentialité
            </a>

            <span class="footer-sep" aria-hidden="true">•</span>

            <a [routerLink]="localePath.link('cookies-policy')" class="footer-link" i18n="@@footer_cookies">
              Politique des cookies
            </a>
          </div>

          <small class="footer-copy" i18n="@@footer_copyright">
            © {{ year }} Tools Central – Outils en ligne gratuits
          </small>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-root { min-height: 100vh; display: flex; flex-direction: column; }

    .app-header {
      position: sticky; top: 0; z-index: 100;
      background: var(--surface-card);
      border-bottom: 1px solid var(--border-color);
      backdrop-filter: blur(10px);
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .header-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      padding-bottom: 1rem;
    }

    .brand {
      display: flex; align-items: center; gap: 0.6rem;
      font-size: 1.25rem; font-weight: 700;
      color: var(--text-color); text-decoration: none;
    }

    .brand-icon { border-radius: 12px; display: block; flex-shrink: 0; }
    .brand-text { letter-spacing: 0.02em; }

    .header-actions { display: flex; align-items: center; gap: 1rem; }

    .lang-item { display: flex; align-items: center; gap: 0.6rem; }
    .flag-emoji { font-size: 1.1rem; line-height: 1; }
    .lang-text { font-weight: 500; }
    .lang-locale { margin-left: auto; opacity: 0.6; font-size: 0.85rem; }

    .app-main { flex: 1; }

    .app-footer {
      background: var(--surface-card);
      border-top: 1px solid var(--border-color);
      padding: 1.5rem 0;
      text-align: center;
      color: var(--text-color-secondary);
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }
  `]
})
export class AppComponent {
  themeService = inject(ThemeService);
  seo = inject(SeoService);
  private platformId = inject(PLATFORM_ID);
  localePath = inject(LocalePathService);

  year = new Date().getFullYear();

  localeOptions: LocaleOption[] = [...LOCALES];
  selectedLocale!: LocaleOption;

  homeHref = '/fr/';

  ngOnInit() {
    // Active canonical/hreflang auto sur chaque navigation (SSR ok)
    this.seo.init();

    if (!isPlatformBrowser(this.platformId)) {
      this.selectedLocale = LOCALES[0];
      return;
    }

    const firstSegment = (location.pathname.split('/').filter(Boolean)[0] ?? 'fr');
    this.selectedLocale = LOCALES.find(l => l.locale === firstSegment) ?? LOCALES[0];
    this.homeHref = `/${this.selectedLocale.locale}/`;
  }

  onLocaleChange(option: LocaleOption) {
    if (!isPlatformBrowser(this.platformId)) return;

    this.selectedLocale = option;
    this.homeHref = `/${option.locale}/`;

    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length > 0) parts[0] = option.locale;
    else parts.push(option.locale);

    location.assign('/' + parts.join('/') + location.search + location.hash);
  }
}
