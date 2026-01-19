import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ingreso } from './ingreso/ingreso';
import { GymRoutingModule } from './gym-routing-module';

@NgModule({
  declarations: [
    Ingreso,
  ],
  imports: [
    CommonModule,
    FormsModule,
    GymRoutingModule

  ]
})
export class GymModule { }
