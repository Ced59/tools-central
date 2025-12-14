import '@angular/common/locales/global/pt';
import '@angular/common/locales/global/pt-BR';

import '@angular/platform-server/init';

import { provideServerRendering } from '@angular/ssr';
import {
  ApplicationConfig,
  mergeApplicationConfig,
  provideZoneChangeDetection
} from '@angular/core';
import {
  bootstrapApplication,
  BootstrapContext
} from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideNoopAnimations()
  ]
};

const config = mergeApplicationConfig(appConfig, serverConfig);

// ⚠️ ICI : on reçoit le BootstrapContext et on le passe au bootstrapApplication
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
