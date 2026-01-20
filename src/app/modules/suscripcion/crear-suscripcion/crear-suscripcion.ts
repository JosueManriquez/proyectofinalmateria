import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SuscripcionModelo, SuscripcionService } from '../../../services/suscripcion';
import { UsuarioCrear, UsuarioService } from '../../../services/usuario';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-crear-suscripcion',
  templateUrl: './crear-suscripcion.html',
  styleUrls: ['./crear-suscripcion.css'],
  standalone: false
})
export class CrearSuscripcion implements OnInit {
  // Lista de suscripciones
  suscripciones$: Observable<SuscripcionModelo[]> = of([]);

  // Modelo para el formulario de creación
  suscripcion: SuscripcionModelo = {
    uidUsuario: '',
    tipo: 'MENSUAL',
    fechaInicio: new Date(),
    fechaFin: new Date(),
    activa: true
  };

  // Para edición
  editarId: string | null = null;

  constructor(
    private susService: SuscripcionService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarSuscripciones();
  }

  // Cargar todas las suscripciones
  cargarSuscripciones() {
    this.suscripciones$ = this.susService.listarSuscripciones();
    this.cdr.detectChanges();
  }

  // Guardar o actualizar suscripción
  async guardarSuscripcion() {
    try {
      if (!this.suscripcion.uidUsuario || !this.suscripcion.fechaInicio || !this.suscripcion.fechaFin) {
        alert('Completa todos los campos');
        return;
      }

      if (this.editarId) {
        await this.susService.actualizarSuscripcion(this.editarId, this.suscripcion);
      } else {
        await this.susService.crearSuscripcion(this.suscripcion);
      }

      this.limpiarForm();
      this.cargarSuscripciones();
    } catch (error: any) {
      alert(error.message || 'Ocurrió un error al guardar la suscripción');
    }
  }

  // Editar: llena un formulario aparte
  editar(s: SuscripcionModelo) {
    this.editarId = s.id!;
    this.suscripcion = { ...s };
  }

  // Activar o desactivar suscripción
  async toggleEstado(s: SuscripcionModelo) {
    if (!s.id) return;
    await this.susService.activarDesactivar(s.id, !s.activa);
    s.activa = !s.activa; // actualizar localmente
    this.cdr.detectChanges();
  }

  // Eliminar suscripción
  async eliminar(s: SuscripcionModelo) {
    if (!s.id) return;
    if (!confirm('¿Estás seguro de eliminar esta suscripción?')) return;
    await this.susService.eliminarSuscripcion(s.id);
    this.cargarSuscripciones();
  }

  // Limpiar formulario
  limpiarForm() {
    this.editarId = null;
    this.suscripcion = {
      uidUsuario: '',
      tipo: 'MENSUAL',
      fechaInicio: new Date(),
      fechaFin: new Date(),
      activa: true
    };
  }
}
