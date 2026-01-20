import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SuscripcionModelo, SuscripcionService } from '../../../services/suscripcion';
import { UsuarioService, UsuarioCrear } from '../../../services/usuario';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-renovar-suscripcion',
  standalone: false,
  templateUrl: './renovar-suscripcion.html',
  styleUrls: ['./renovar-suscripcion.css']
})
export class RenovarSuscripcion implements OnInit {

  ciUsuario: string = '';
  usuario: UsuarioCrear | null = null;
  suscripcionActual: SuscripcionModelo | null = null;

  tipoNuevoPlan: 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL' = 'MENSUAL';
  fechaInicioNueva: Date = new Date();
  fechaFinNueva: Date = new Date();

  mensaje: string = '';
  today: Date = new Date();

  constructor(
    private susService: SuscripcionService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  // Buscar usuario y última suscripción
  async buscarUsuario() {
    this.usuario = await firstValueFrom(this.usuarioService.obtenerUsuarioPorCI(this.ciUsuario));
    if (!this.usuario) {
      this.mensaje = 'El CI no existe en usuarios';
      this.suscripcionActual = null;
      return;
    }

    // Buscar última suscripción del usuario
    const todas = await firstValueFrom(this.susService.listarSuscripciones());
    const subsUsuario = todas
      .filter(s => s.uidUsuario === this.ciUsuario)
      .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());

    this.suscripcionActual = subsUsuario.length ? subsUsuario[0] : null;

    // Definir fecha de inicio de la nueva suscripción
    if (this.suscripcionActual?.activa) {
      this.fechaInicioNueva = new Date(this.suscripcionActual.fechaFin);
    } else {
      this.fechaInicioNueva = new Date();
    }

    // Fecha fin sugerida por defecto (ejemplo +1 mes para mensual)
    this.calcularFechaFin();

    this.cdr.detectChanges();
  }

  calcularFechaFin() {
    const inicio = new Date(this.fechaInicioNueva);
    switch (this.tipoNuevoPlan) {
      case 'MENSUAL':
        inicio.setMonth(inicio.getMonth() + 1);
        break;
      case 'TRIMESTRAL':
        inicio.setMonth(inicio.getMonth() + 3);
        break;
      case 'ANUAL':
        inicio.setFullYear(inicio.getFullYear() + 1);
        break;
    }
    this.fechaFinNueva = inicio;
  }

  // Renovar suscripción
  async renovar() {
    if (!this.usuario) {
      this.mensaje = 'Primero busca un usuario válido';
      return;
    }

    const nuevaSus: SuscripcionModelo = {
      uidUsuario: this.ciUsuario,
      tipo: this.tipoNuevoPlan,
      fechaInicio: this.fechaInicioNueva,
      fechaFin: this.fechaFinNueva,
      activa: true,
      usuario: this.usuario
    };

    // Guardar nueva suscripción
    await this.susService.crearSuscripcion(nuevaSus);

    // Marcar la anterior como inactiva si existía
    if (this.suscripcionActual) {
      await this.susService.activarDesactivar(this.suscripcionActual.id!, false);
    }

    this.mensaje = 'Suscripción renovada correctamente';
    this.suscripcionActual = nuevaSus;
    this.tipoNuevoPlan = 'MENSUAL';
    this.cdr.detectChanges();
  }

}
