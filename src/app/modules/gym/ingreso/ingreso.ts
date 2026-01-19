import { Component, ChangeDetectorRef } from '@angular/core';
import { UsuarioService } from '../../../services/usuario';
import { SuscripcionService } from '../../../services/suscripcion';
import { AsistenciaService } from '../../../services/asistencia';
import { UsuarioModelo } from '../../../models/usuario.model';

@Component({
  selector: 'app-ingreso',
  standalone: false,
  templateUrl: './ingreso.html',
  styleUrls: ['./ingreso.css']
})
export class Ingreso {

  ci: string = '';
  mensaje: string = '';
  usuarioEncontrado: UsuarioModelo | null = null;
  diasRestantes: number = 0;

  constructor(
    private usuarioService: UsuarioService,
    private suscripcionService: SuscripcionService,
    private asistenciaService: AsistenciaService,
    private cdr: ChangeDetectorRef
  ) { }

  async registrarIngreso() {
    this.mensaje = '';
    this.usuarioEncontrado = null;
    debugger
    if (!this.ci) {
      this.mensaje = 'Ingresa tu C.I.';
      return;
    }

    try {
      const usuario = await this.usuarioService.obtenerUsuarioPorCI(this.ci).toPromise();

      if (!usuario) {
        this.mensaje = 'Usuario no registrado';
        this.cdr.detectChanges();
        return;
      }

      this.usuarioEncontrado = usuario;

      const suscripcion = await this.suscripcionService.obtenerSuscripcionActiva(usuario.uid).toPromise();
      if (!suscripcion) {
        this.mensaje = 'No tiene suscripción activa';
        this.cdr.detectChanges();
        return;
      }

      const hoy = new Date();
      const fechaFin = suscripcion.fechaFin; // ⚠ ya es Date
      this.diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

      await this.asistenciaService.registrarEntrada(usuario.uid);

      this.mensaje = `Bienvenido ${usuario.nombre} ${usuario.apellido}. Te quedan ${this.diasRestantes} días de suscripción.`;
      this.cdr.detectChanges();

    } catch (error) {
      console.error(error);
      this.mensaje = 'Error al registrar ingreso';
      this.cdr.detectChanges();
    }
  }
}
