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
    }

    ]
  },

  { path: 'usuario', component: BienvenidaUsuario }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
