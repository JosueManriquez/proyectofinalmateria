import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Login } from './login/login';
import { Registrar } from './registrar/registrar';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    Login,
    Registrar
  ],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class AuthModule { }
