import '@angular/platform-server/init';

import { provideServerRendering, withRoutes } from '@angular/ssr';
import {
  ApplicationConfig,
  mergeApplicationConfig,
  provideZoneChangeDetection
} from '@angular/core';
import {
  bootstrapApplication,
  BootstrapContext
} from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { serverRoutes } from './app/app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes))
  ]
};

const config = mergeApplicationConfig(appConfig, serverConfig);

export default function bootstrap(context: BootstrapContext) {
  return bootstrapApplication(
    AppComponent,
    {
      ...config,
      providers: [provideZoneChangeDetection(), ...config.providers]
    },
    context
  );
}
