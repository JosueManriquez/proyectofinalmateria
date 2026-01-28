import { Component, Injector, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SuscripcionService } from '../../../services/suscripcion';
import { UsuarioService } from '../../../services/usuario';
import { SuscripcionModelo } from '../../../models/suscripcion';
import { UsuarioModelo } from '../../../models/usuario.model';
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

  tipos = ['MENSUAL', 'TRIMESTRAL', 'ANUAL'];
  mensajeError: string = '';

  constructor(
    private fb: FormBuilder,
    private suscripcionService: SuscripcionService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      ci: ['', Validators.required]
    });

    this.renovarForm = this.fb.group({
      tipo: ['MENSUAL', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required]
    });

    this.renovarForm.get('tipo')?.valueChanges.subscribe(() => this.calcularFechaFin());
    this.renovarForm.get('fechaInicio')?.valueChanges.subscribe(() => this.calcularFechaFin());
  }

  ngOnDestroy(): void {
    if (this.subHistorial) {
      this.subHistorial.unsubscribe();
    }
  }

  async buscarUsuario() {
    this.mensajeError = '';
    this.usuarioEncontrado = null;
    this.historialSuscripciones = [];
    this.ultimaSuscripcion = null;

    if (this.subHistorial) {
      this.subHistorial.unsubscribe();
    }

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
        ? this.ultimaSuscripcion.fechaFin.toDate()
        : new Date(this.ultimaSuscripcion.fechaFin);

      const diaSiguiente = new Date(finAnterior);
      diaSiguiente.setDate(diaSiguiente.getDate() + 1);

      fechaSugerida = diaSiguiente > hoy ? diaSiguiente : hoy;
      this.minFechaInicio = this.formatDateString(fechaSugerida);
    } else {
      this.minFechaInicio = this.formatDateString(hoy);
    }

    this.renovarForm.patchValue({
      tipo: 'MENSUAL',
      fechaInicio: this.formatDateString(fechaSugerida)
    });

    this.calcularFechaFin();
  }

  calcularFechaFin() {
    const tipo = this.renovarForm.get('tipo')?.value;
    const inicioStr = this.renovarForm.get('fechaInicio')?.value;

    if (!inicioStr || !tipo) return;

    const inicio = this.parseFechaLocal(inicioStr);
    const fin = new Date(inicio);

    if (tipo === 'MENSUAL') fin.setMonth(fin.getMonth() + 1);
    else if (tipo === 'TRIMESTRAL') fin.setMonth(fin.getMonth() + 3);
    else if (tipo === 'ANUAL') fin.setFullYear(fin.getFullYear() + 1);

    fin.setDate(fin.getDate() - 1);

    this.renovarForm.patchValue({
      fechaFin: this.formatDateString(fin)
    }, { emitEvent: false });
  }

  // --- ACCIÓN PRINCIPAL CORREGIDA ---
  async procesarRenovacion() {
    if (this.renovarForm.invalid || !this.usuarioEncontrado) return;

    const { tipo, fechaInicio, fechaFin } = this.renovarForm.value;
    const inicioDate = this.parseFechaLocal(fechaInicio);
    const finDate = this.parseFechaLocal(fechaFin);

    try {
      if (this.ultimaSuscripcion) {
        await this.suscripcionService.renovarSuscripcion(
          this.ultimaSuscripcion,
          tipo,
          inicioDate,
          finDate
        );
      } else {
        // CORRECCIÓN: Usar operador OR (||) para evitar 'undefined' en Firestore
        const nueva: SuscripcionModelo = {
          UsuarioModeloCi: this.usuarioEncontrado.ci || '',
          UsuarioModeloApellido: this.usuarioEncontrado.apellido || '', // Evita el error de la imagen
          tipo,
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
      alert('Error al procesar la suscripción. Revisa la consola.');
    }
  }

  private limpiarPantalla() {
    this.renovarForm.reset();
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