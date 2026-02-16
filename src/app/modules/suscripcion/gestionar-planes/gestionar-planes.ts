import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SuscripcionService } from '../../../services/suscripcion';
import { PlanModelo } from '../../../models/plan.model';

@Component({
  selector: 'app-gestionar-planes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestionar-planes.html',
  styleUrls: ['./gestionar-planes.css']
})
export class GestionarPlanes implements OnInit {

  listaPlanes: PlanModelo[] = [];
  planForm: FormGroup;
  modoEdicion: boolean = false;
  idPlanEditar: string | null = null;
  mostrarModal: boolean = false;
  
  // VARIABLES NUEVAS PARA LA IMAGEN
  imagenSeleccionada: File | null = null;
  imagenPreview: string | ArrayBuffer | null = null;
  subiendoImagen: boolean = false; // Para mostrar un "Cargando..."

  constructor(
    private subService: SuscripcionService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.planForm = this.fb.group({
      nombre: ['', Validators.required],
      precio: [0, [Validators.required, Validators.min(0)]],
      duracionDias: [30, [Validators.required, Validators.min(1)]],
      descripcion: [''],
      imagenUrl: [''], // Este campo se llenará solo
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.cargarPlanes();
  }

  cargarPlanes() {
    this.subService.obtenerPlanesActivos().subscribe(planes => {
      this.listaPlanes = planes;
      this.cdr.detectChanges();
    });
  }

  // --- NUEVA FUNCIÓN: DETECTAR SELECCIÓN DE ARCHIVO ---
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagenSeleccionada = file;
      
      // Crear preview local para que el usuario vea qué seleccionó
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPreview = reader.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  abrirModalCrear() {
    this.modoEdicion = false;
    this.imagenSeleccionada = null; // Resetear imagen
    this.imagenPreview = null;
    this.planForm.reset({
      precio: 0,
      duracionDias: 30,
      activo: true,
      imagenUrl: ''
    });
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  abrirModalEditar(plan: PlanModelo) {
    this.modoEdicion = true;
    this.idPlanEditar = plan.id || null;
    this.imagenSeleccionada = null;
    // Si ya tiene imagen, mostrarla en el preview
    this.imagenPreview = plan.imagenUrl || null; 
    
    this.planForm.patchValue(plan);
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.idPlanEditar = null;
    this.subiendoImagen = false;
    this.cdr.detectChanges();
  }

  async guardarPlan() {
    if (this.planForm.invalid) return;
    this.subiendoImagen = true; // Activar spinner

    let data = this.planForm.value;

    try {
      // 1. SI EL USUARIO SELECCIONÓ UNA IMAGEN NUEVA, LA SUBIMOS PRIMERO
      if (this.imagenSeleccionada) {
        const urlFirebase = await this.subService.subirImagen(this.imagenSeleccionada, data.nombre);
        data.imagenUrl = urlFirebase; // Reemplazamos el link con el nuevo de Firebase
      }

      // 2. GUARDAMOS LOS DATOS EN FIRESTORE
      if (this.modoEdicion && this.idPlanEditar) {
        await this.subService.actualizarPlan(this.idPlanEditar, data);
        alert('Plan actualizado con éxito');
      } else {
        await this.subService.crearPlan(data);
        alert('Plan creado con éxito');
      }
      
      this.cerrarModal();

    } catch (error) {
      console.error("Error:", error);
      alert('Error al subir la imagen o guardar el plan.');
    } finally {
      this.subiendoImagen = false; // Desactivar spinner
    }
  }

  async alternarEstado(plan: PlanModelo) {
    if (!plan.id) return;
    try {
      await this.subService.actualizarPlan(plan.id, { ...plan, activo: !plan.activo });
    } catch (error) { console.error(error); }
  }
}