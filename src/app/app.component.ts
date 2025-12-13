import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ThemeService } from './services/theme.service';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { LOCALES, type LocaleOption } from './i18n/locales.generated';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ButtonModule,
    NgOptimizedImage,
    FormsModule,
    SelectModule
  ],
  template: `
    <div class="app-root">
      <header class="app-header">
        <div class="header-inner container">
          <a href="/" class="brand" aria-label="Tools Central">
            <img
              ngSrc="/assets/icons/tools.png"
              alt=""
              class="brand-icon"
              width="32"
              height="32"
              priority
            />
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
                  <span class="flag-emoji">{{ item.emoji }}</span>
                  <span class="lang-text">{{ item.nameNative }}</span>
                </div>
              </ng-template>

              <ng-template pTemplate="item" let-item>
                <div class="lang-item">
                  <img
                    class="flag"
                    [src]="'/assets/flags/' + item.flag + '.svg'"
                    width="18"
                    height="14"
                    alt=""
                  />
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
        <div class="container">
          <small>&copy; {{ year }} Tools Central – Outils en ligne gratuits</small>
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

  year = new Date().getFullYear();

  localeOptions: LocaleOption[] = [...LOCALES];
  selectedLocale!: LocaleOption;

  ngOnInit() {
    const firstSegment = (location.pathname.split('/').filter(Boolean)[0] ?? 'fr');
    this.selectedLocale = LOCALES.find((l: LocaleOption) => l.locale === firstSegment) ?? LOCALES[0];
  }

  onLocaleChange(option: LocaleOption) {
    const locale = option.locale;

    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length > 0) parts[0] = locale;
    else parts.push(locale);

    location.assign('/' + parts.join('/') + location.search + location.hash);
  }
}
