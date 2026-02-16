import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { RenovarSuscripcion } from './renovar-suscripcion/renovar-suscripcion';
import { Historial } from './historial/historial';
import { GestionarPlanes } from './gestionar-planes/gestionar-planes';
/* import { CrearSuscripcion } from './crear-suscripcion/crear-suscripcion';
 */
// ✅ CrearSuscripcion es standalone, se importa en imports, NO en declarations

@NgModule({
  declarations: [
    // RenovarSuscripcion,
  
    /* GestionarPlanes */
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    /* CrearSuscripcion, */
    RenovarSuscripcion,
    Historial
  ]
})
export class SuscripcionModule {}
