import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 1. Importar ChangeDetectorRef
import { UsuarioService } from '../../../services/usuario';
import { SuscripcionService } from '../../../services/suscripcion';
import { SuscripcionModelo } from '../../../models/suscripcion';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.html',
  standalone: false
})
export class DashboardHome implements OnInit {

  totalUsuarios: number = 0;
  suscripcionesActivas: number = 0;

  constructor(
    private usuarioService: UsuarioService,
    private suscripcionService: SuscripcionService,
    private cdr: ChangeDetectorRef // 2. Inyectar aquí
  ) {}

  ngOnInit(): void {
    console.log("Cargando Dashboard Home...");

    // Contar Usuarios
    this.usuarioService.obtenerUsuarios().subscribe(users => {
      console.log("Usuarios recibidos:", users.length);
      this.totalUsuarios = users.length;
      this.cdr.detectChanges(); // 3. Forzar actualización visual
    });

    // Contar Suscripciones Activas
    this.suscripcionService.obtenerHistorialGlobal().subscribe((subs: SuscripcionModelo[]) => {
      // Filtramos solo las que tienen activa = true
      const activas = subs.filter(s => s.activa);
      console.log("Suscripciones activas:", activas.length);
      
      this.suscripcionesActivas = activas.length;
      this.cdr.detectChanges(); // 3. Forzar actualización visual
    });
  }
}