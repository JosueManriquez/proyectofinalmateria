import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // <- IMPORTAR RouterModule

import { CrearSuscripcion } from './crear-suscripcion/crear-suscripcion';
import { RenovarSuscripcion } from './renovar-suscripcion/renovar-suscripcion';
import { Historial } from './historial/historial';

@NgModule({
  declarations: [
    CrearSuscripcion,
    RenovarSuscripcion,
    Historial
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule  // <- Debe estar aquí
  ]
})
export class SuscripcionModule { }
