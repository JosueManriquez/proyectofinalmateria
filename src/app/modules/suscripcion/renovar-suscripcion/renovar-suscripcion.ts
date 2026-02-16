import { Component, Injector, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SuscripcionService } from '../../../services/suscripcion';
import { UsuarioService } from '../../../services/usuario';
import { SuscripcionModelo } from '../../../models/suscripcion';
import { UsuarioModelo } from '../../../models/usuario.model';
import { PlanModelo } from '../../../models/plan.model'; // IMPORTAR
import { firstValueFrom, Subscription } from 'rxjs';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-renovar-suscripcion',
  templateUrl: './renovar-suscripcion.html',
  styleUrls: ['./renovar-suscripcion.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class RenovarSuscripcion implements OnInit, OnDestroy {

  searchForm!: FormGroup;
  renovarForm!: FormGroup;

  usuarioEncontrado: UsuarioModelo | null = null;
  historialSuscripciones: SuscripcionModelo[] = [];
  ultimaSuscripcion: SuscripcionModelo | null = null;
  minFechaInicio: string = '';
  private subHistorial: Subscription | null = null;

  // NUEVAS VARIABLES PARA PLANES
  listaPlanes: PlanModelo[] = [];
  planSeleccionado: PlanModelo | null = null;
  mostrarModalPlanes: boolean = false; // Controla la visibilidad del modal

  mensajeError: string = '';

  constructor(
    private fb: FormBuilder,
    private suscripcionService: SuscripcionService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // 1. Cargar los planes disponibles al iniciar
    this.cargarPlanes();

    this.searchForm = this.fb.group({
      ci: ['', Validators.required]
    });

    this.renovarForm = this.fb.group({
      nombrePlan: ['', Validators.required], // Solo lectura
      precio: [0, Validators.required],      // Solo lectura
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required]
    });

    // Recalcular fecha fin si cambia la fecha de inicio manual
    this.renovarForm.get('fechaInicio')?.valueChanges.subscribe(() => {
      if (this.planSeleccionado) this.actualizarFechaFin();
    });
  }

  ngOnDestroy(): void {
    if (this.subHistorial) this.subHistorial.unsubscribe();
  }

  cargarPlanes() {
    this.suscripcionService.obtenerPlanesActivos().subscribe(planes => {
      this.listaPlanes = planes;
    });
  }

  // --- LÓGICA DEL MODAL ---
  abrirModalPlanes() {
    this.mostrarModalPlanes = true;
  }

  cerrarModalPlanes() {
    this.mostrarModalPlanes = false;
  }

  seleccionarPlan(plan: PlanModelo) {
    this.planSeleccionado = plan;
    
    // Asignar valores al formulario
    this.renovarForm.patchValue({
      nombrePlan: plan.nombre,
      precio: plan.precio
    });

    this.actualizarFechaFin();
    this.cerrarModalPlanes();
  }

  actualizarFechaFin() {
    const inicioStr = this.renovarForm.get('fechaInicio')?.value;
    if (!inicioStr || !this.planSeleccionado) return;

    const inicio = this.parseFechaLocal(inicioStr);
    const fin = new Date(inicio);
    
    // Sumar los días exactos que dice el plan
    fin.setDate(fin.getDate() + this.planSeleccionado.duracionDias);

    this.renovarForm.patchValue({
      fechaFin: this.formatDateString(fin)
    });
  }

  // ... (MANTENER CÓDIGO DE buscarUsuario IGUAL) ...
  async buscarUsuario() {
    this.mensajeError = '';
    this.usuarioEncontrado = null;
    this.historialSuscripciones = [];
    this.ultimaSuscripcion = null;
    this.planSeleccionado = null; // Resetear plan
    this.renovarForm.reset();

    if (this.subHistorial) this.subHistorial.unsubscribe();

    const ci = this.searchForm.value.ci;
    if (!ci) return;

    try {
      const usuario = await firstValueFrom(this.usuarioService.obtenerUsuarioPorCI(ci));
      if (!usuario) {
        this.mensajeError = 'Usuario no encontrado con ese CI.';
        this.cdr.detectChanges();
        return;
      }

      this.usuarioEncontrado = usuario;
      this.cdr.detectChanges();

      this.subHistorial = this.suscripcionService.obtenerHistorialPorCI(ci).subscribe(data => {
        this.historialSuscripciones = data.map(s => ({
          ...s,
          fechaInicio: s.fechaInicio instanceof Timestamp ? s.fechaInicio.toDate() : s.fechaInicio,
          fechaFin: s.fechaFin instanceof Timestamp ? s.fechaFin.toDate() : s.fechaFin
        }));

        if (this.historialSuscripciones.length > 0) {
          this.ultimaSuscripcion = this.historialSuscripciones[0];
          this.prepararFormularioRenovacion();
        } else {
          this.prepararFormularioRenovacion(true);
        }
        this.cdr.detectChanges();
      });

    } catch (error) {
      console.error(error);
      this.mensajeError = 'Error al buscar datos.';
      this.cdr.detectChanges();
    }
  }

  prepararFormularioRenovacion(esNuevo: boolean = false) {
    const hoy = new Date();
    let fechaSugerida = hoy;

    if (!esNuevo && this.ultimaSuscripcion) {
      const finAnterior = this.ultimaSuscripcion.fechaFin instanceof Timestamp
        ? (this.ultimaSuscripcion.fechaFin as any).toDate()
        : new Date(this.ultimaSuscripcion.fechaFin);

      const diaSiguiente = new Date(finAnterior);
      diaSiguiente.setDate(diaSiguiente.getDate() + 1);

      fechaSugerida = diaSiguiente > hoy ? diaSiguiente : hoy;
      this.minFechaInicio = this.formatDateString(fechaSugerida);
    } else {
      this.minFechaInicio = this.formatDateString(hoy);
    }

    this.renovarForm.patchValue({
      fechaInicio: this.formatDateString(fechaSugerida)
    });
    // Nota: No calculamos fin aquí porque falta seleccionar el plan
  }

  async procesarRenovacion() {
    if (this.renovarForm.invalid || !this.usuarioEncontrado || !this.planSeleccionado) {
        alert("Por favor selecciona un plan.");
        return;
    }

    const { fechaInicio, fechaFin, precio } = this.renovarForm.value; // Ya tenemos precio del form
    const inicioDate = this.parseFechaLocal(fechaInicio);
    const finDate = this.parseFechaLocal(fechaFin);

    try {
      if (this.ultimaSuscripcion) {
        // Lógica de renovar
        // NOTA: Debes actualizar renovarSuscripcion en el servicio para aceptar precioPagado si quieres
         const nueva: SuscripcionModelo = {
          UsuarioModeloCi: this.usuarioEncontrado.ci || '',
          UsuarioModeloApellido: this.usuarioEncontrado.apellido || '',
          tipo: this.planSeleccionado.nombre, // Usamos el nombre del plan
          precioPagado: precio, // Guardamos cuánto pagó
          fechaInicio: inicioDate,
          fechaFin: finDate,
          activa: true
        };
        // Aquí puedes adaptar el servicio para desactivar la anterior y crear esta nueva manualmente
        // O actualizar tu método renovarSuscripcion
        if (this.ultimaSuscripcion.id) {
            await this.suscripcionService.activarDesactivar(this.ultimaSuscripcion.id, false);
        }
        await this.suscripcionService.crearSuscripcion(nueva);

      } else {
        const nueva: SuscripcionModelo = {
          UsuarioModeloCi: this.usuarioEncontrado.ci || '',
          UsuarioModeloApellido: this.usuarioEncontrado.apellido || '',
          tipo: this.planSeleccionado.nombre,
          precioPagado: precio,
          fechaInicio: inicioDate,
          fechaFin: finDate,
          activa: true
        };
        await this.suscripcionService.crearSuscripcion(nueva);
      }

      alert('Suscripción procesada con éxito');
      this.limpiarPantalla();

    } catch (error) {
      console.error(error);
      alert('Error al procesar la suscripción.');
    }
  }

  private limpiarPantalla() {
    this.renovarForm.reset();
    this.planSeleccionado = null;
    this.usuarioEncontrado = null;
    this.searchForm.reset();
    this.historialSuscripciones = [];
    if (this.subHistorial) this.subHistorial.unsubscribe();
    this.cdr.detectChanges();
  }

  private parseFechaLocal(fecha: string): Date {
    const [year, month, day] = fecha.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatDateString(fecha: any): string {
    const d = new Date(fecha);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }
}