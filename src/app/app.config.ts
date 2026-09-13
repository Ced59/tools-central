import { ApplicationConfig } from '@angular/core';
import {provideRouter, withInMemoryScrolling} from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  provideClientHydration,
  withI18nSupport,
  withNoIncrementalHydration,
} from '@angular/platform-browser';
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
    provideHttpClient(withXhr()),
    provideClientHydration(withNoIncrementalHydration(), withI18nSupport()),
    provideMatomo(
      {
        siteId: 3,
        trackerUrl: 'https://matomo.cedric-caudron.com',
      },
      withRouter()
    ),
  ]
};
