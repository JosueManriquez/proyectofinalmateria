import { Component, ChangeDetectorRef, OnInit, ViewChild, ElementRef, AfterViewInit, Injector, runInInjectionContext } from '@angular/core';
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

  // Variable de BLOQUEO para evitar doble ingreso rápido
  procesando: boolean = false; 

  // Datos para mostrar
  usuarioEncontrado: UsuarioModelo | null = null;
  diasRestantes: number = 0;
  nombrePlan: string = '';
  fechaVencimiento: Date | null = null;

  private timeoutId: any;

  // Sonidos
 /*  audioExito = new Audio('assets/sounds/success.mp3');
  audioError = new Audio('assets/sounds/error.mp3'); */

  constructor(
    private usuarioService: UsuarioService,
    private suscripcionService: SuscripcionService,
    private asistenciaService: AsistenciaService,
    private cdr: ChangeDetectorRef,
    private injector: Injector
  ) {
    /* this.audioExito.volume = 0.5;
    this.audioError.volume = 0.5; */
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.enfocarInput();
  }

  async registrarIngreso(event?: any) {
    // 1. Evitar propagación de eventos
    if (event) { try { event.preventDefault(); event.stopPropagation(); } catch (e) { } }

    // 2. BLOQUEO DE SEGURIDAD: Si ya está trabajando, no hace nada
    if (this.procesando) {
      console.warn('⛔ Intento de doble ingreso bloqueado.');
      return;
    }

    // Activamos el bloqueo
    this.procesando = true;
    this.limpiarEstado(false, false);

    if (!this.ci) {
      this.mostrarMensaje('⚠️ Ingresa el número de C.I.', true);
      this.procesando = false; // Liberamos bloqueo
      return;
    }

    try {
      // Consultas iniciales
      const usuarioPromise = firstValueFrom(this.usuarioService.obtenerUsuarioPorCI(this.ci));
      const suscripcionPromise = firstValueFrom(this.suscripcionService.obtenerSuscripcionActiva(this.ci));

      const [usuario, suscripcion] = await Promise.all([usuarioPromise, suscripcionPromise]);

      if (!usuario) {
        this.mostrarMensaje('❌ Usuario no encontrado', true);
        this.procesando = false;
        return;
      }
      this.usuarioEncontrado = usuario;

      // --- VALIDACIÓN 1: SUSCRIPCIÓN ACTIVA ---
      if (!suscripcion) {
        this.mostrarMensaje('⛔ SIN SUSCRIPCIÓN ACTIVA', true);
        this.procesando = false;
        return;
      }

      this.nombrePlan = suscripcion.tipo;
      const hoy = new Date();
      // Resetear horas para comparar fechas puras (opcional pero recomendado)
      hoy.setHours(0,0,0,0);

      const fechaFin = suscripcion.fechaFin instanceof Timestamp ? suscripcion.fechaFin.toDate() : new Date(suscripcion.fechaFin);
      this.fechaVencimiento = fechaFin;
      
      // Cálculo de días restantes
      const diferenciaTiempo = fechaFin.getTime() - new Date().getTime();
      this.diasRestantes = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));

      if (this.diasRestantes < 0) {
        this.mostrarMensaje(`⛔ SUSCRIPCIÓN VENCIDA`, true);
        this.procesando = false;
        return;
      }

      // --- VALIDACIÓN 2: VERIFICAR SI YA VINO HOY ---
      if (usuario.uid) {
        
       /*  console.log(`🔍 Verificando historial para: ${usuario.nombre}`);  //nombre del usuario que ingreso su CI
 */
        const asistenciasSnap = await runInInjectionContext(this.injector, () => {
           return firstValueFrom(this.asistenciaService.obtenerUltimaAsistencia(usuario.uid!)); 
        });

        /* console.log(`📄 Registros encontrados: ${asistenciasSnap.docs.length}`); */

        if (!asistenciasSnap.empty) {
          // Extraer datos
          const asistencias = asistenciasSnap.docs.map(doc => doc.data() as any);
          
          // Ordenar por fecha descendente (la más reciente primero)
          asistencias.sort((a, b) => {
             const fechaA = a.fecha instanceof Timestamp ? a.fecha.toDate() : new Date(a.fecha);
             const fechaB = b.fecha instanceof Timestamp ? b.fecha.toDate() : new Date(b.fecha);
             return fechaB.getTime() - fechaA.getTime();
          });

          const ultima = asistencias[0];
          const fechaUltima = ultima.fecha instanceof Timestamp ? ultima.fecha.toDate() : new Date(ultima.fecha);
          
          // Resetear horas de la última asistencia para comparar solo DÍA/MES/AÑO
          const fechaUltimaSinHora = new Date(fechaUltima);
          fechaUltimaSinHora.setHours(0,0,0,0);

              // para comparar asistencias en consola
/*           console.log(`📅 Última asistencia: ${fechaUltimaSinHora.toLocaleDateString()} vs Hoy: ${hoy.toLocaleDateString()}`);
 */
          if (fechaUltimaSinHora.getTime() === hoy.getTime()) {
            const horaEntrada = fechaUltima.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            this.mostrarMensaje(`⚠️ YA INGRESASTE HOY (${horaEntrada})`, true);
            /* this.audioError.play().catch(() => {}); */
            this.procesando = false; // Liberamos bloqueo
            return; 
          }
        }
      }

      // --- REGISTRO EXITOSO ---
      this.mostrarMensaje(`✅ BIENVENIDO, ${usuario.nombre.split(' ')[0].toUpperCase()}`, false);

      if (usuario.uid) {
        await this.asistenciaService.registrarEntrada(usuario.uid, usuario.ci);
      }

    } catch (error) {
      console.error(error);
      this.mostrarMensaje('Error de conexión', true);
    } finally {
      // SIEMPRE liberamos el bloqueo al terminar (sea éxito o error)
      this.procesando = false; 
    }
  }

  mostrarMensaje(texto: string, error: boolean) {
    this.mensaje = texto;
    this.esError = error;

    //sonido de error cuadno no hay usuario o la suscripcion esta vencida, y sonido de exito cuando el ingreso es correcto
    /* try {
      if (error) this.audioError.play().catch(() => { });
      else this.audioExito.play().catch(() => { });
    } catch (e) { } */

    this.cdr.detectChanges();
    this.programarLimpieza(error ? 7000 : 7000);
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