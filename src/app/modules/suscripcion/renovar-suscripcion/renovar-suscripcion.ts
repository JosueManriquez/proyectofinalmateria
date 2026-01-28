import { Component, Injector, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core'; // 1. Importar OnDestroy
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SuscripcionService } from '../../../services/suscripcion';
import { UsuarioService } from '../../../services/usuario';
import { SuscripcionModelo } from '../../../models/suscripcion';
import { UsuarioModelo } from '../../../models/usuario.model';
import { firstValueFrom, Subscription } from 'rxjs'; // 2. Importar Subscription
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-renovar-suscripcion',
  templateUrl: './renovar-suscripcion.html',
  styleUrls: ['./renovar-suscripcion.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class RenovarSuscripcion implements OnInit, OnDestroy { // 3. Implementar OnDestroy

  // Formularios
  searchForm!: FormGroup;
  renovarForm!: FormGroup;

  // Datos
  usuarioEncontrado: UsuarioModelo | null = null;
  historialSuscripciones: SuscripcionModelo[] = [];
  ultimaSuscripcion: SuscripcionModelo | null = null;

  // Control de suscripciones (Para evitar memoria llena o errores)
  private subHistorial: Subscription | null = null; 

  // Opciones
  tipos = ['MENSUAL', 'TRIMESTRAL', 'ANUAL'];
  mensajeError: string = '';

  constructor(
    private fb: FormBuilder,
    private suscripcionService: SuscripcionService,
    private usuarioService: UsuarioService,
    private injector: Injector,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      ci: ['', Validators.required]
    });

    this.renovarForm = this.fb.group({
      tipo: ['MENSUAL', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required]
    });

    // Recálculo automático de fechas
    this.renovarForm.get('tipo')?.valueChanges.subscribe(() => this.calcularFechaFin());
    this.renovarForm.get('fechaInicio')?.valueChanges.subscribe(() => this.calcularFechaFin());
  }

  // 4. Limpiar suscripciones al salir de la pantalla
  ngOnDestroy(): void {
    if (this.subHistorial) {
      this.subHistorial.unsubscribe();
    }
  }

  // --- LÓGICA DE BÚSQUEDA ---

  async buscarUsuario() {
    // 1. Limpiar estado anterior
    this.mensajeError = '';
    this.usuarioEncontrado = null;
    this.historialSuscripciones = [];
    this.ultimaSuscripcion = null;
    
    // Si había una búsqueda anterior escuchando cambios, la cancelamos
    if (this.subHistorial) {
      this.subHistorial.unsubscribe();
    }

    const ci = this.searchForm.value.ci;
    if (!ci) return;

    try {
      // 2. Buscar Usuario (Async/Await)
      const usuario = await firstValueFrom(this.usuarioService.obtenerUsuarioPorCI(ci));
      
      if (!usuario) {
        this.mensajeError = 'Usuario no encontrado con ese CI.';
        this.cdr.detectChanges(); // Forzar actualización visual del error
        return;
      }
      
      // Mostrar usuario encontrado inmediatamente
      this.usuarioEncontrado = usuario;
      this.cdr.detectChanges(); // IMPORTANTE: Pintar los datos del usuario YA

      // 3. Cargar Historial (Observable)
      // Guardamos la suscripción en 'subHistorial'
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

        // IMPORTANTE: Forzar actualización cada vez que lleguen datos del historial
        this.cdr.detectChanges(); 
      });

    } catch (error) {
      console.error(error);
      this.mensajeError = 'Error al buscar datos.';
      this.cdr.detectChanges();
    }
  }

  // --- LÓGICA DE FECHAS ---

  prepararFormularioRenovacion(esNuevo: boolean = false) {
    let inicio = new Date(); 

    if (!esNuevo && this.ultimaSuscripcion) {
        const finAnterior = new Date(this.ultimaSuscripcion.fechaFin);
        if (finAnterior > new Date()) {
            inicio = new Date(finAnterior);
            inicio.setDate(inicio.getDate() + 1); 
        }
    }

    this.renovarForm.patchValue({
      fechaInicio: this.formatDateString(inicio),
      tipo: 'MENSUAL'
    });
    
    this.calcularFechaFin();
  }

  calcularFechaFin() {
    const tipo = this.renovarForm.get('tipo')?.value;
    const inicioStr = this.renovarForm.get('fechaInicio')?.value;

    if (!inicioStr || !tipo) return;

    const inicio = this.parseFechaLocal(inicioStr);
    const fin = new Date(inicio);

    if (tipo === 'MENSUAL') {
      fin.setMonth(fin.getMonth() + 1);
    } else if (tipo === 'TRIMESTRAL') {
      fin.setMonth(fin.getMonth() + 3);
    } else if (tipo === 'ANUAL') {
      fin.setFullYear(fin.getFullYear() + 1);
    }

    fin.setDate(fin.getDate() - 1);

    this.renovarForm.patchValue({
      fechaFin: this.formatDateString(fin)
    }, { emitEvent: false }); 
  }

  // --- ACCIÓN PRINCIPAL ---

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
        const nueva: SuscripcionModelo = {
            UsuarioModeloCi: this.usuarioEncontrado.ci,
            UsuarioModeloApellido: this.usuarioEncontrado.apellido,
            tipo,
            fechaInicio: inicioDate,
            fechaFin: finDate,
            activa: true
        };
        await this.suscripcionService.crearSuscripcion(nueva);
      }

      alert('Suscripción renovada con éxito');
      
      // Resetear todo
      this.renovarForm.reset();
      this.usuarioEncontrado = null; 
      this.searchForm.reset();
      this.historialSuscripciones = [];
      if (this.subHistorial) this.subHistorial.unsubscribe(); // Dejar de escuchar cambios
      
      this.cdr.detectChanges(); // Actualizar vista final

    } catch (error) {
      console.error(error);
      alert('Error al renovar la suscripción');
    }
  }

  // --- UTILIDADES DE FECHA ---

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