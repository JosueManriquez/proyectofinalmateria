import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SuscripcionService } from '../../../services/suscripcion';
import { UsuarioService } from '../../../services/usuario';
import { UsuarioModelo } from '../../../models/usuario.model';
import { firstValueFrom } from 'rxjs';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-crear-suscripcion',
  templateUrl: './crear-suscripcion.html',
  styleUrls: ['./crear-suscripcion.css'], // <--- TIENE QUE COINCIDIR EL NOMBRE  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class CrearSuscripcion implements OnInit {

  suscripcionForm!: FormGroup;
  tipos = ['MENSUAL', 'TRIMESTRAL', 'ANUAL'];
  suscripciones: any[] = [];

  // Para mostrar info del usuario antes de guardar
  usuarioEncontrado: UsuarioModelo | null = null;
  mensajeUsuario: string = '';

  constructor(
    private fb: FormBuilder,
    private suscripcionService: SuscripcionService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Inicializamos con fecha de hoy por defecto
    const hoy = this.formatDateString(new Date());

    this.suscripcionForm = this.fb.group({
      ci: ['', Validators.required],
      tipo: ['MENSUAL', Validators.required],
      fechaInicio: [hoy, Validators.required],
      fechaFin: ['', Validators.required] // Será readonly
    });

    this.cargarSuscripciones();
    this.calcularFechaFin(); // Calcular inicial

    // Detectar cambios para recalcular fecha fin automáticamente
    this.suscripcionForm.get('tipo')?.valueChanges.subscribe(() => this.calcularFechaFin());
    this.suscripcionForm.get('fechaInicio')?.valueChanges.subscribe(() => this.calcularFechaFin());
  }

  // --- LÓGICA DE NEGOCIO ---

  // Buscar usuario al perder el foco del input CI o presionar Enter
  async verificarUsuario() {
    const ci = this.suscripcionForm.get('ci')?.value;
    if (!ci) return;

    this.mensajeUsuario = 'Buscando...';
    this.usuarioEncontrado = null;

    try {
      const usuario = await firstValueFrom(this.usuarioService.obtenerUsuarioPorCI(ci));
      if (usuario) {
        this.usuarioEncontrado = usuario;
        this.mensajeUsuario = `✅ Usuario: ${usuario.nombre} ${usuario.apellido}`;
      } else {
        this.mensajeUsuario = '❌ Usuario no encontrado. Regístralo primero.';
      }
    } catch (error) {
      this.mensajeUsuario = 'Error al buscar usuario.';
    }
    this.cdr.detectChanges();
  }

  calcularFechaFin() {
    const tipo = this.suscripcionForm.get('tipo')?.value;
    const inicioStr = this.suscripcionForm.get('fechaInicio')?.value;

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

    // Restamos 1 día para exactitud
    fin.setDate(fin.getDate() - 1);

    this.suscripcionForm.patchValue({
      fechaFin: this.formatDateString(fin)
    }, { emitEvent: false });
  }

  async guardarSuscripcion() {
    if (this.suscripcionForm.invalid) {
      this.suscripcionForm.markAllAsTouched();
      return;
    }

    // Validar que tengamos usuario verificado
    if (!this.usuarioEncontrado) {
      await this.verificarUsuario();
      if (!this.usuarioEncontrado) {
        alert('No se puede crear suscripción: Usuario no existe.');
        return;
      }
    }

    const { tipo, fechaInicio, fechaFin } = this.suscripcionForm.value;
    const inicio = this.parseFechaLocal(fechaInicio);
    const fin = this.parseFechaLocal(fechaFin);

    if (fin < inicio) {
      alert('Error en las fechas.');
      return;
    }

    const nuevaSuscripcion = {
      UsuarioModeloCi: this.usuarioEncontrado.ci,
      UsuarioModeloApellido: this.usuarioEncontrado.apellido,
      tipo,
      fechaInicio: inicio,
      fechaFin: fin,
      activa: true
    };

    try {
      // NOTA: Ya no necesitamos runInInjectionContext aquí porque está en el servicio
      await this.suscripcionService.crearSuscripcion(nuevaSuscripcion);

      alert('Suscripción creada con éxito');
      this.suscripcionForm.reset({
        tipo: 'MENSUAL',
        fechaInicio: this.formatDateString(new Date())
      });
      this.usuarioEncontrado = null;
      this.mensajeUsuario = '';

      // Recalcular fechas tras reset
      setTimeout(() => this.calcularFechaFin(), 100);

    } catch (error) {
      console.error(error);
      alert('Error al guardar');
    }
  }

  cargarSuscripciones() {
    this.suscripcionService.listarSuscripciones().subscribe(data => {
      this.suscripciones = data.map(s => ({
        ...s,
        fechaInicio: s.fechaInicio instanceof Timestamp ? s.fechaInicio.toDate() : s.fechaInicio,
        fechaFin: s.fechaFin instanceof Timestamp ? s.fechaFin.toDate() : s.fechaFin
      }));
      // Ordenar por fecha fin descendente
      this.suscripciones.sort((a, b) => new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime());
      this.cdr.detectChanges();
    });
  }

  async eliminarSuscripcion(id: string) {
    if (!confirm('¿Estás seguro de eliminar esta suscripción?')) return;
    try {
      await this.suscripcionService.eliminarSuscripcion(id);
    } catch (error) {
      console.error(error);
    }
  }

  // --- UTILS ---
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