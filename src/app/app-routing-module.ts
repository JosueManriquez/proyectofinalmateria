import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Componentes de Autenticación
import { Registrar } from './modules/auth/registrar/registrar';
import { Login } from './modules/auth/login/login';

// Componentes del Dashboard Admin
import { BienvenidaAdmin } from './modules/dashboard/bienvenida-admin/bienvenida-admin';
import { DashboardHome } from './modules/dashboard/dashboard-home/dashboard-home'; 
import { CambiarRol } from './modules/dashboard/bienvenida-admin/cambiar-rol/cambiar-rol';
import { DesactivarUsuario } from './modules/dashboard/bienvenida-admin/desactivar-usuario/desactivar-usuario';
import { GestionarCategoria } from './modules/dashboard/gestionar-categoria/gestionar-categoria';
import { AgregarProducto } from './modules/dashboard/agregar-producto/agregar-producto';
import { GestionarProducto } from './modules/dashboard/gestionar-producto/gestionar-producto';

// Componentes de Gestión de Usuarios (Admin)
import { CrearUsuario } from './modules/dashboard/bienvenida-admin/usuarios/crear-usuario/crear-usuario';
import { ListarUsuarios } from './modules/dashboard/bienvenida-admin/usuarios/listar-usuarios/listar-usuarios';
import { EditarUsuario } from './modules/dashboard/bienvenida-admin/usuarios/editar-usuario/editar-usuario';

// Componentes de Suscripción (Admin)
import { RenovarSuscripcion } from './modules/suscripcion/renovar-suscripcion/renovar-suscripcion';
import { Historial } from './modules/suscripcion/historial/historial';
import { Reportes } from './modules/suscripcion/reportes/reportes';


/* import { CrearSuscripcion } from './modules/suscripcion/crear-suscripcion/crear-suscripcion';
 */

import { GestionarPlanes } from './modules/suscripcion/gestionar-planes/gestionar-planes'; // NUEVO
// Componentes de Usuario/Cliente y Gym
import { BienvenidaUsuario } from './modules/dashboard/bienvenida-usuario/bienvenida-usuario';
import { Ingreso } from './modules/gym/ingreso/ingreso';

// --- IMPORTACIÓN DE GUARDS ---
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

const routes: Routes = [
  // Rutas Públicas
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'registrar', component: Registrar },
  { path: 'login', component: Login },

  // RUTAS DE ADMINISTRADOR (Protegidas con adminGuard)
  {
    path: 'admin',
    component: BienvenidaAdmin,
    canActivate: [adminGuard], // 🔒 Bloquea todo el acceso si no es admin
    children: [
      // Home del Dashboard
      { path: '', component: DashboardHome }, 

      // Herramientas
      { path: 'cambiar-rol', component: CambiarRol },
      { path: 'desactivar-usuario', component: DesactivarUsuario },
      
      // Productos y Categorías
      { path: 'gestionar-categoria', component: GestionarCategoria },
      { path: 'agregar-producto', component: AgregarProducto },
      { path: 'gestionar-producto', component: GestionarProducto },
      
      // Gestión de Usuarios
      { path: 'usuarios', component: ListarUsuarios },
      { path: 'usuarios/crear', component: CrearUsuario },
      { path: 'usuarios/editar/:id', component: EditarUsuario },

      // Gestión de Suscripciones
      /* { path: 'suscripcion/crear-suscripcion', component: CrearSuscripcion }, */
      { path: 'suscripcion/renovar-suscripcion', component: RenovarSuscripcion },
      { path: 'suscripcion/historial', component: Historial },
      { path: 'gestionar-planes', component: GestionarPlanes },
      { path: 'reportes', component: Reportes },

    ]
  },

  // RUTAS DE CLIENTE (Protegidas con authGuard)
  { 
    path: 'usuario', 
    component: BienvenidaUsuario,
    canActivate: [authGuard] // 🔒 Solo usuarios logueados
  },

  // RUTA DE INGRESO (Recepción)
  { 
    path: 'ingreso', 
    component: Ingreso,
    canActivate: [adminGuard] // 🔒 Protegido para que solo el personal acceda a la terminal adsa
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }