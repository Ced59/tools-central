import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { ButtonModule } from 'primeng/button';
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonModule, NgOptimizedImage],
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
            <nav
              class="lang-switcher"
              aria-label="Sélecteur de langue"
              i18n-aria-label="@@lang_switcher_aria"
            >
              <a href="/fr/" class="lang-link">FR</a>
              <a href="/en/" class="lang-link">EN</a>
              <a href="/de/" class="lang-link">DE</a>
            </nav>

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
  standalone: true,
  styles: [`
    .app-root {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .app-header {
      position: sticky;
      top: 0;
      z-index: 100;
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
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-color);
      text-decoration: none;
    }

    .brand-icon {
      border-radius: 12px;
      display: block;
      flex-shrink: 0;
    }

    .brand-text {
      letter-spacing: 0.02em;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .lang-switcher {
      display: flex;
      gap: 0.5rem;
    }

    .lang-link {
      padding: 0.35rem 0.6rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-color-secondary);
      transition: all 0.2s ease;
    }

    .lang-link:hover {
      background: var(--primary-color);
      color: #fff;
    }

    .app-main {
      flex: 1;
    }

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
}
