import { NgModule, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

import { environment } from '../environments/environment';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AuthModule } from './modules/auth/auth-module';
import { FormsModule } from '@angular/forms';
import { DashboardModule } from './modules/dashboard/dashboard-module';
import { GymModule } from './modules/gym/gym-module';
import { SuscripcionModule } from './modules/suscripcion/suscripcion-module';

registerLocaleData(localeEs);

@NgModule({
  declarations: [
    App,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AuthModule,
    DashboardModule,
    GymModule,
    SuscripcionModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'es' },
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    /* provideClientHydration(withEventReplay()) */
  ],
  bootstrap: [App]
})
export class AppModule { }
