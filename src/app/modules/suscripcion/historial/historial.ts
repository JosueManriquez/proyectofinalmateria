import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // 1. Importar ChangeDetectorRef y OnDestroy
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuscripcionService } from '../../../services/suscripcion';
import { SuscripcionModelo } from '../../../models/suscripcion';
import { Timestamp } from 'firebase/firestore';
import { Subscription } from 'rxjs'; // 2. Importar Subscription

@Component({
  selector: 'app-historial',
  templateUrl: './historial.html',
  styleUrls: ['./historial.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class Historial implements OnInit, OnDestroy { // 3. Implementar OnDestroy

  suscripciones: SuscripcionModelo[] = []; 
  suscripcionesFiltradas: SuscripcionModelo[] = []; 
  textoBusqueda: string = ''; 
  cargando: boolean = true;
  
  // Variable para controlar la memoria
  private suscripcionData: Subscription | null = null;

  constructor(
    private suscripcionService: SuscripcionService,
    private cdr: ChangeDetectorRef // 4. Inyectar el detector de cambios
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  // 5. Limpiar suscripción al salir
  ngOnDestroy(): void {
    if (this.suscripcionData) {
      this.suscripcionData.unsubscribe();
    }
  }

  cargarDatos() {
    this.cargando = true;

    // Si ya había una suscripción, la limpiamos antes de crear otra
    if (this.suscripcionData) {
      this.suscripcionData.unsubscribe();
    }

    // Guardamos la suscripción en la variable
    this.suscripcionData = this.suscripcionService.listarSuscripciones().subscribe(data => {
      
      this.suscripciones = data.map(s => ({
        ...s,
        fechaInicio: s.fechaInicio instanceof Timestamp ? s.fechaInicio.toDate() : s.fechaInicio,
        fechaFin: s.fechaFin instanceof Timestamp ? s.fechaFin.toDate() : s.fechaFin
      }));

      // Ordenar: Más recientes primero
      this.suscripciones.sort((a, b) => {
        const dateA = new Date(a.fechaFin).getTime();
        const dateB = new Date(b.fechaFin).getTime();
        return dateB - dateA; 
      });

      this.filtrar();
      this.cargando = false;

      // 6. ¡EL TRUCO! Forzar la actualización visual
      this.cdr.detectChanges(); 
    });
  }

  filtrar() {
    if (!this.textoBusqueda) {
      this.suscripcionesFiltradas = this.suscripciones;
    } else {
      const texto = this.textoBusqueda.toLowerCase();
      this.suscripcionesFiltradas = this.suscripciones.filter(s => 
        s.UsuarioModeloCi.toLowerCase().includes(texto) || 
        s.UsuarioModeloApellido.toLowerCase().includes(texto)
      );
    }
    // También actualizamos aquí por si escribes muy rápido
    this.cdr.detectChanges();
  }

  eliminar(id: string | undefined) {
    if(!id) return;
    if(confirm('¿Estás seguro de eliminar este registro del historial?')) {
      this.suscripcionService.eliminarSuscripcion(id);
    }
  }
}