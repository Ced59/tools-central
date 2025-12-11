import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    template: `
    <div class="app-root">
      <header class="app-header">
        <div class="header-inner">
          <div class="brand">
            <a href="/fr/" class="brand-link">Tools Central</a>
          </div>
          <nav class="lang-switcher">
            <a href="/fr/" class="lang-link">FR</a>
            <a href="/en/" class="lang-link">EN</a>
          </nav>
        </div>
      </header>

      <main class="app-main">
        <router-outlet></router-outlet>
      </main>

      <footer class="app-footer">
        <small>&copy; {{ year }} – Tools Central</small>
      </footer>
    </div>
  `
})
export class AppComponent {
  year = new Date().getFullYear();
}
