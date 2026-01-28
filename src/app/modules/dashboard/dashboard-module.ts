import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BienvenidaAdmin } from './bienvenida-admin/bienvenida-admin';
import { BienvenidaUsuario } from './bienvenida-usuario/bienvenida-usuario';
import { CambiarRol } from './bienvenida-admin/cambiar-rol/cambiar-rol';
import { DesactivarUsuario } from './bienvenida-admin/desactivar-usuario/desactivar-usuario';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GestionarCategoria } from './gestionar-categoria/gestionar-categoria';
import { AgregarProducto } from './agregar-producto/agregar-producto';
import { GestionarProducto } from './gestionar-producto/gestionar-producto';
import { ListarUsuarios } from './bienvenida-admin/usuarios/listar-usuarios/listar-usuarios';
import { CrearUsuario } from './bienvenida-admin/usuarios/crear-usuario/crear-usuario';
import { EditarUsuario } from './bienvenida-admin/usuarios/editar-usuario/editar-usuario';

@NgModule({
  declarations: [
    BienvenidaAdmin,
    BienvenidaUsuario,
    CambiarRol,
    DesactivarUsuario,
    GestionarCategoria,
    AgregarProducto,
    GestionarProducto,
    ListarUsuarios,
    CrearUsuario,
    EditarUsuario,

  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    RouterModule,
    

  ]
})
export class DashboardModule { }
/* asdasdas */