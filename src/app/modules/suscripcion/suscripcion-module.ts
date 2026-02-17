import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// 1. IMPORTAR TUS COMPONENTES
import { RenovarSuscripcion } from './renovar-suscripcion/renovar-suscripcion';
/* import { CrearSuscripcion } from './crear-suscripcion/crear-suscripcion'; // (Si lo tienes)
 */
import { GestionarPlanes } from './gestionar-planes/gestionar-planes';
import { Reportes } from './reportes/reportes';
import { BaseChartDirective } from 'ng2-charts';
// 2. IMPORTAR LIBRERÍA DE GRÁFICOS (Para que funcione en Reportes)
/* import { BaseChartDirective } from 'ng2-charts';
 */
@NgModule({
  declarations: [
    RenovarSuscripcion,
    //CrearSuscripcion, // Descomenta si lo tienes
    GestionarPlanes,
    Reportes,
/*     Reportes
 */  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule, // Importante para la navegación
    BaseChartDirective // <--- Esto habilita los gráficos en este módulo
  ]
})
export class SuscripcionModule { }