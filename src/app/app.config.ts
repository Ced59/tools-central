import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import {providePrimeNG} from "primeng/config";
import Aura from '@primeng/themes/aura';
import {provideMatomo, withRouter} from "ngx-matomo-client";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
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
        siteId: 2,
        trackerUrl: 'https://matomo.cedric-caudron.com',
      },
      withRouter()
    ),
  ]
};
