import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Registrar } from './modules/auth/registrar/registrar';
import { Login } from './modules/auth/login/login';
import { BienvenidaAdmin } from './modules/dashboard/bienvenida-admin/bienvenida-admin';
import { BienvenidaUsuario } from './modules/dashboard/bienvenida-usuario/bienvenida-usuario';
import { CambiarRol } from './modules/dashboard/bienvenida-admin/cambiar-rol/cambiar-rol';
import { DesactivarUsuario } from './modules/dashboard/bienvenida-admin/desactivar-usuario/desactivar-usuario';
import { GestionarCategoria } from './modules/dashboard/gestionar-categoria/gestionar-categoria';
import { AgregarProducto } from './modules/dashboard/agregar-producto/agregar-producto';
import { GestionarProducto } from './modules/dashboard/gestionar-producto/gestionar-producto';
import { Ingreso } from './modules/gym/ingreso/ingreso';
import { CrearUsuario } from './modules/dashboard/bienvenida-admin/usuarios/crear-usuario/crear-usuario';
import { ListarUsuarios } from './modules/dashboard/bienvenida-admin/usuarios/listar-usuarios/listar-usuarios';
import { EditarUsuario } from './modules/dashboard/bienvenida-admin/usuarios/editar-usuario/editar-usuario';
import { RenovarSuscripcion } from './modules/suscripcion/renovar-suscripcion/renovar-suscripcion';
import { Historial } from './modules/suscripcion/historial/historial';
import { CrearSuscripcion } from './modules/suscripcion/crear-suscripcion/crear-suscripcion';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'registrar', component: Registrar },
  { path: 'login', component: Login },
  {
    path: 'admin',
    component: BienvenidaAdmin,
    children: [{ path: 'cambiar-rol', component: CambiarRol },
    {
      path: 'desactivar-usuario',
      component: DesactivarUsuario
    },
    {
      path: 'gestionar-categoria',
      component: GestionarCategoria
    },
    {
      path: 'agregar-producto',
      component: AgregarProducto
    },
    {
      path: 'gestionar-producto',
      component: GestionarProducto
    },
    { path: 'usuarios', component: ListarUsuarios },
    { path: 'usuarios/crear', component: CrearUsuario },
    { path: 'usuarios/editar/:uid', component: EditarUsuario },

      // suscricion
    { path: 'suscripcion/crear-suscripcion', component: CrearSuscripcion },
    { path: 'suscripcion/renovar-suscripcion', component: RenovarSuscripcion },
    { path: 'suscripcion/historial', component: Historial }
    ]
  },

  { path: 'usuario', component: BienvenidaUsuario },

  { path: 'ingreso', component: Ingreso }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
