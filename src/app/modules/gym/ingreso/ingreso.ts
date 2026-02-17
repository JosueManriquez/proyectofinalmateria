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
  
  // Datos para mostrar
  usuarioEncontrado: UsuarioModelo | null = null;
  diasRestantes: number = 0;
  nombrePlan: string = '';
  fechaVencimiento: Date | null = null;

  private timeoutId: any;

  // Sonidos (Opcional: asegúrate de tener los archivos en assets o comenta esto)
  audioExito = new Audio('assets/sounds/success.mp3'); 
  audioError = new Audio('assets/sounds/error.mp3');

  constructor(
    private usuarioService: UsuarioService,
    private suscripcionService: SuscripcionService,
    private asistenciaService: AsistenciaService,
    private cdr: ChangeDetectorRef
  ) { 
    // Configuración de volumen
    this.audioExito.volume = 0.5;
    this.audioError.volume = 0.5;
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.enfocarInput();
  }

  async registrarIngreso(event?: any) {
    if (event) {
      try {
        event.preventDefault();
        event.stopPropagation();
      } catch (e) { }
    }

    this.limpiarEstado(false, false);

    if (!this.ci) {
      this.mostrarMensaje('⚠️ Ingresa el número de C.I.', true);
      return;
    }

    try {
      const usuarioPromise = firstValueFrom(this.usuarioService.obtenerUsuarioPorCI(this.ci));
      const suscripcionPromise = firstValueFrom(this.suscripcionService.obtenerSuscripcionActiva(this.ci));

      const [usuario, suscripcion] = await Promise.all([usuarioPromise, suscripcionPromise]);

      if (!usuario) {
        this.mostrarMensaje('❌ Usuario no encontrado', true);
        return;
      }

      this.usuarioEncontrado = usuario;

      if (!suscripcion) {
        this.mostrarMensaje('⛔ SIN SUSCRIPCIÓN ACTIVA', true);
        return;
      }

      // Datos de la suscripción
      this.nombrePlan = suscripcion.tipo; // Asumiendo que 'tipo' es el nombre del plan
      const hoy = new Date();
      const fechaFin = suscripcion.fechaFin instanceof Timestamp
        ? suscripcion.fechaFin.toDate()
        : new Date(suscripcion.fechaFin);
      
      this.fechaVencimiento = fechaFin;
      this.diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

      // Validación de días
      if (this.diasRestantes < 0) {
        this.mostrarMensaje(`⛔ SUSCRIPCIÓN VENCIDA HACE ${Math.abs(this.diasRestantes)} DÍAS`, true);
        return;
      }

      // Éxito
      this.mostrarMensaje(`✅ BIENVENIDO, ${usuario.nombre.split(' ')[0].toUpperCase()}`, false);

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
    
    // Reproducir sonido (Manejo de errores por si no existe el archivo)
    try {
        if (error) this.audioError.play().catch(() => {});
        else this.audioExito.play().catch(() => {});
    } catch (e) {}

    this.cdr.detectChanges();
    this.programarLimpieza(error ? 6000 : 7000); 
    this.enfocarInput();
  }

  limpiarEstado(borrarCi: boolean = true, enfocar: boolean = true) {
    this.mensaje = '';
    this.usuarioEncontrado = null;
    this.diasRestantes = 0;
    this.nombrePlan = '';
    this.fechaVencimiento = null;

    if (borrarCi) this.ci = '';
    if (this.timeoutId) clearTimeout(this.timeoutId);

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