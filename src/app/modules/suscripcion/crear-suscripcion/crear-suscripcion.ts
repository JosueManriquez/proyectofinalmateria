/* import { Component, OnInit, Injector } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { SuscripcionService } from '../../../services/suscripcion';
import { UsuarioService } from '../../../services/usuario';

import { firstValueFrom } from 'rxjs';
import { runInInjectionContext } from '@angular/core';

@Component({
  selector: 'app-crear-suscripcion',
  templateUrl: './crear-suscripcion.html',
  styleUrls: ['./crear-suscripcion.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class CrearSuscripcion implements OnInit {

  suscripcionForm!: FormGroup;
  tipos = ['MENSUAL', 'TRIMESTRAL', 'ANUAL'];

  constructor(
    private fb: FormBuilder,
    private suscripcionService: SuscripcionService,
    private usuarioService: UsuarioService,
    private injector: Injector // ✅ Injector para runInInjectionContext
  ) {}

  ngOnInit(): void {
    this.suscripcionForm = this.fb.group({
      ci: ['', Validators.required],
      tipo: ['MENSUAL', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required]
    });
  }

  async guardarSuscripcion() {
    console.log('guardarSuscripcion llamado'); // debug rápido

    if (this.suscripcionForm.invalid) {
      alert('Completa todos los campos');
      return;
    }

    const { ci, tipo, fechaInicio, fechaFin } = this.suscripcionForm.value;

    // 🔎 Obtener usuario por CI
    const usuario = await firstValueFrom(
      this.usuarioService.obtenerUsuarioPorCI(ci)
    );

    if (!usuario) {
      alert('El CI no existe en la base de datos');
      return;
    }

    const nuevaSuscripcion = {
      UsuarioModeloCi: usuario.ci,
      UsuarioModeloApellido: usuario.apellido,
      tipo,
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      activa: true
    };

    try {
      // ⚡ Ejecutar la creación dentro de un contexto de inyección
      await runInInjectionContext(this.injector, async () => {
        await this.suscripcionService.crearSuscripcion(nuevaSuscripcion);
      });

      alert('Suscripción creada con éxito');
      this.suscripcionForm.reset({ tipo: 'MENSUAL' });

    } catch (error) {
      console.error('Error creando suscripción:', error);
      alert('Ocurrió un error al crear la suscripción');
    }
  }
} */

import { Component, OnInit, Injector, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { SuscripcionService } from '../../../services/suscripcion';
import { UsuarioService } from '../../../services/usuario';

import { firstValueFrom } from 'rxjs';
import { runInInjectionContext } from '@angular/core';
import { Timestamp } from 'firebase/firestore'; // 🔹 Importa Timestamp

@Component({
  selector: 'app-crear-suscripcion',
  templateUrl: './crear-suscripcion.html',
  styleUrls: ['./crear-suscripcion.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class CrearSuscripcion implements OnInit {

  suscripcionForm!: FormGroup;
  tipos = ['MENSUAL', 'TRIMESTRAL', 'ANUAL'];

  suscripciones: any[] = []; // 🔹 Lista de suscripciones para la tabla

  constructor(
    private fb: FormBuilder,
    private suscripcionService: SuscripcionService,
    private usuarioService: UsuarioService,
    private injector: Injector,
    private cdr: ChangeDetectorRef,
    
  ) {}
  //fecha actual y local
    private parseFechaLocal(fecha: string): Date {
    const [year, month, day] = fecha.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatDateString(fecha: any): string {
    // Convierte cualquier fecha tipo Date en "YYYY-MM-DD" para parseFechaLocal
    const d = new Date(fecha);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
} 

  ngOnInit(): void {
    this.suscripcionForm = this.fb.group({
      ci: ['', Validators.required],
      tipo: ['MENSUAL', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required]
    });

    // 🔹 Cargar suscripciones usando runInInjectionContext
    runInInjectionContext(this.injector, () => {
      this.cargarSuscripciones();
    });
  }

  async guardarSuscripcion() {

    const { ci, tipo, fechaInicio, fechaFin } = this.suscripcionForm.value;

    // 1️⃣ Validar campos vacíos
    if (!ci || !tipo || !fechaInicio || !fechaFin) {
      alert('Completa todos los campos');
      return;
    }

    // 2️⃣ Convertir fechas correctamente (sin timezone)
    const inicio = this.parseFechaLocal(fechaInicio);
    const fin = this.parseFechaLocal(fechaFin);

    // 3️⃣ Validar coherencia de fechas
    // ❌ solo cuando FIN es ANTES que INICIO
    if (fin < inicio) {
      alert('La fecha fin no puede ser anterior a la fecha inicio');
      return;
    }

    // 4️⃣ Validar CI (solo si fechas están bien)
    const usuario = await firstValueFrom(
      this.usuarioService.obtenerUsuarioPorCI(ci)
    );

    if (!usuario) {
      alert('El CI no existe en la base de datos');
      return;
    }

    // 5️⃣ Crear suscripción
    const nuevaSuscripcion = {
      UsuarioModeloCi: usuario.ci,
      UsuarioModeloApellido: usuario.apellido,
      tipo,
      fechaInicio: inicio,
      fechaFin: fin,
      activa: true
    };

    try {
      await runInInjectionContext(this.injector, async () => {
        await this.suscripcionService.crearSuscripcion(nuevaSuscripcion);
      });

      alert('Suscripción creada con éxito');
      this.suscripcionForm.reset({ tipo: 'MENSUAL' });
      this.cargarSuscripciones();

    } catch (error) {
      console.error(error);
    }
  }


  cargarSuscripciones() {
    this.suscripcionService.listarSuscripciones().subscribe(data => {
      this.suscripciones = data.map(s => ({
        ...s,
        fechaInicio: s.fechaInicio instanceof Timestamp 
                    ? s.fechaInicio.toDate() 
                    : this.parseFechaLocal(this.formatDateString(s.fechaInicio)),
        fechaFin: s.fechaFin instanceof Timestamp 
                    ? s.fechaFin.toDate() 
                    : this.parseFechaLocal(this.formatDateString(s.fechaFin))
      }));
      this.cdr.detectChanges();
    });
  }

  async eliminarSuscripcion(id: string) {
    // 1️⃣ Confirmación del usuario
    const confirmacion = confirm('¿Estás seguro de eliminar esta suscripción?');
    if (!confirmacion) return; // si cancela, no hacer nada

    try {
      // 2️⃣ Ejecutar eliminación en contexto de inyección
      await runInInjectionContext(this.injector, async () => {
        await this.suscripcionService.eliminarSuscripcion(id);
      });

      // 3️⃣ Recargar automáticamente la tabla
      this.cargarSuscripciones();

      alert('Suscripción eliminada correctamente');
    } catch (error) {
/*       console.error('Error eliminando suscripción:', error);
      alert('Ocurrió un error al eliminar la suscripción'); */
    }
  }
}
