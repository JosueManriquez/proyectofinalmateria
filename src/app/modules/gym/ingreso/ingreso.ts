import { Component, ChangeDetectorRef, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
export class Ingreso implements OnInit, AfterViewInit {

  @ViewChild('ciInput') ciInput!: ElementRef;

  ci: string = '';
  mensaje: string = '';
  esError: boolean = false;
  usuarioEncontrado: UsuarioModelo | null = null;
  diasRestantes: number = 0;
  private timeoutId: any;

  constructor(
    private usuarioService: UsuarioService,
    private suscripcionService: SuscripcionService,
    private asistenciaService: AsistenciaService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.enfocarInput();
  }

  // CORRECCIÓN AQUÍ: Agregamos "event?: any" para que el HTML no de error
  async registrarIngreso(event?: any) {

    // Si nos llega el evento (desde el enter o click), prevenimos recarga por seguridad
    if (event) {
      try {
        event.preventDefault();
        event.stopPropagation();
      } catch (e) {
        // Ignorar si el evento no es cancelable
      }
    }

    // Lógica del doble click: No enfocamos el input inmediatamente (false)
    this.limpiarEstado(false, false);

    if (!this.ci) {
      this.mostrarMensaje('Ingresa el número de C.I.', true);
      return;
    }

    try {
      const usuarioPromise = firstValueFrom(this.usuarioService.obtenerUsuarioPorCI(this.ci));
      const suscripcionPromise = firstValueFrom(this.suscripcionService.obtenerSuscripcionActiva(this.ci));

      const [usuario, suscripcion] = await Promise.all([usuarioPromise, suscripcionPromise]);

      if (!usuario) {
        this.mostrarMensaje('Usuario no registrado', true);
        return;
      }

      this.usuarioEncontrado = usuario;

      if (!suscripcion) {
        this.mostrarMensaje('⛔ SIN SUSCRIPCIÓN ACTIVA', true);
        return;
      }

      const hoy = new Date();
      const fechaFin = suscripcion.fechaFin instanceof Timestamp
        ? suscripcion.fechaFin.toDate()
        : new Date(suscripcion.fechaFin);

      this.diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

      if (this.diasRestantes < 0) {
        this.mostrarMensaje('⛔ SUSCRIPCIÓN VENCIDA', true);
        return;
      }

      // Éxito
      this.mostrarMensaje(`✅ BIENVENIDO`, false);

      if (usuario.uid) {
        this.asistenciaService.registrarEntrada(usuario.uid, usuario.ci).catch(console.error);
      }

    } catch (error) {
      console.error(error);
      this.mostrarMensaje('Error de conexión', true);
    }
  }

  mostrarMensaje(texto: string, error: boolean) {
    this.mensaje = texto;
    this.esError = error;
    this.cdr.detectChanges();
    this.programarLimpieza(error ? 5000 : 8000);//es el tiempo que tarda en limpiar el mensaje,
    //  ahora 5 si hay error y 8 si todo esta bien

    // Al finalizar el proceso, AHÍ SÍ devolvemos el foco al input
    this.enfocarInput();
  }

  limpiarEstado(borrarCi: boolean = true, enfocar: boolean = true) {
    this.mensaje = '';
    this.usuarioEncontrado = null;
    this.diasRestantes = 0;

    if (borrarCi) this.ci = '';
    if (this.timeoutId) clearTimeout(this.timeoutId);

    // Solo enfocamos si se pide explícitamente
    if (enfocar) {
      this.enfocarInput();
    }
  }

  programarLimpieza(tiempo: number) {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.limpiarEstado(true, true);
      this.cdr.detectChanges();
    }, tiempo);
  }

  enfocarInput() {
    setTimeout(() => {
      if (this.ciInput) this.ciInput.nativeElement.focus();
    }, 100);
  }
}