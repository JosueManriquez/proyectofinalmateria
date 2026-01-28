import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { UsuarioService } from '../../../services/usuario';
import { SuscripcionService } from '../../../services/suscripcion';
import { AsistenciaService } from '../../../services/asistencia';
import { UsuarioModelo } from '../../../models/usuario.model';
import { firstValueFrom } from 'rxjs';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-ingreso',
  standalone: false,
  templateUrl: './ingreso.html',
  styleUrls: ['./ingreso.css']
})
export class Ingreso implements OnInit {

  ci: string = '';
  mensaje: string = '';
  esError: boolean = false; // Para pintar el mensaje de rojo o verde
  usuarioEncontrado: UsuarioModelo | null = null;
  diasRestantes: number = 0;

  // Para limpiar la pantalla automáticamente
  private timeoutId: any;

  constructor(
    private usuarioService: UsuarioService,
    private suscripcionService: SuscripcionService,
    private asistenciaService: AsistenciaService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Foco inicial si lo deseas
  }

  async registrarIngreso() {
    // 1. Limpieza visual inmediata
    this.limpiarEstado(false);

    if (!this.ci) {
      this.mostrarMensaje('Ingresa el número de C.I.', true);
      return;
    }

    try {
      // 🚀 OPTIMIZACIÓN 1: PARALELISMO
      // Lanzamos la búsqueda de Usuario y Suscripción AL MISMO TIEMPO.
      // No esperamos a una para lanzar la otra.
      const usuarioPromise = firstValueFrom(this.usuarioService.obtenerUsuarioPorCI(this.ci));
      const suscripcionPromise = firstValueFrom(this.suscripcionService.obtenerSuscripcionActiva(this.ci));

      // Esperamos a que ambas terminen (tardará solo lo que tarde la más lenta, no la suma de las dos)
      const [usuario, suscripcion] = await Promise.all([usuarioPromise, suscripcionPromise]);

      // --- Validaciones (ocurren instantáneamente cuando llegan los datos) ---

      if (!usuario) {
        this.mostrarMensaje('Usuario no registrado', true);
        return;
      }

      if (!usuario.uid) {
        this.mostrarMensaje('Error: Usuario sin UID', true);
        return;
      }

      if (!suscripcion) {
        this.mostrarMensaje('⛔ SIN SUSCRIPCIÓN ACTIVA', true);
        this.usuarioEncontrado = usuario; // Mostramos quién es para que sepa que lo reconocimos
        return;
      }

      // Validación de Fechas
      const hoy = new Date();
      let fechaFin: Date;

      if (suscripcion.fechaFin instanceof Timestamp) {
        fechaFin = suscripcion.fechaFin.toDate();
      } else {
        fechaFin = new Date(suscripcion.fechaFin);
      }

      this.diasRestantes = Math.ceil(
        (fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (this.diasRestantes < 0) {
        this.mostrarMensaje('⛔ SUSCRIPCIÓN VENCIDA', true);
        this.usuarioEncontrado = usuario;
        return;
      }

      // ✅ ÉXITO VISUAL INMEDIATO
      // Mostramos los datos YA, sin esperar a que se guarde en la BD
      this.usuarioEncontrado = usuario;
      this.mostrarMensaje(`✅ BIENVENIDO`, false);
      this.programarLimpieza(); // Timer de 5s

      // 🚀 OPTIMIZACIÓN 2: GUARDADO EN SEGUNDO PLANO
      // Mandamos a guardar la asistencia, pero NO ponemos 'await'.
      // Dejamos que Firebase lo haga a su ritmo mientras el usuario ya entró.
      this.asistenciaService.registrarEntrada(usuario.uid, usuario.ci)
        .then(() => console.log('Asistencia guardada background'))
        .catch(err => console.error('Error guardando asistencia', err));

    } catch (error) {
      console.error(error);
      this.mostrarMensaje('Error de conexión', true);
    }
  }

  // Helpers visuales
  mostrarMensaje(texto: string, error: boolean) {
    this.mensaje = texto;
    this.esError = error;
    this.cdr.detectChanges();
  }

  limpiarEstado(borrarCi: boolean = true) {
    this.mensaje = '';
    this.usuarioEncontrado = null;
    this.diasRestantes = 0;
    if (borrarCi) this.ci = '';
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }

  programarLimpieza() {
    this.timeoutId = setTimeout(() => {
      this.limpiarEstado(true);
      this.cdr.detectChanges();
    }, 10000); // 5 segundos
  }
}