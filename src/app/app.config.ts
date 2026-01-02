import { ApplicationConfig } from '@angular/core';
import {provideRouter, withInMemoryScrolling} from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import {providePrimeNG} from "primeng/config";
import Aura from '@primeng/themes/aura';
import {provideMatomo, withRouter} from "ngx-matomo-client";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',  // 👈 remet en haut à chaque navigation
        anchorScrolling: 'enabled',        // 👈 supporte /page#section
      }),
    ),
    provideHttpClient(),
    provideClientHydration(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: '.dark-mode',
          cssLayer: false
        }
      }
    }),

    provideMatomo(
      {
        siteId: 3,
        trackerUrl: 'https://matomo.cedric-caudron.com',
      },
      withRouter()
    ),
  ]
};
