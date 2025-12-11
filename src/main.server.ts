import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering } from '@angular/platform-server';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideNoopAnimations()  // <-- Remplace provideAnimations() côté serveur
  ]
};

const config = mergeApplicationConfig(appConfig, serverConfig);

export default function bootstrap() {
  return bootstrapApplication(AppComponent, config, context);
}
