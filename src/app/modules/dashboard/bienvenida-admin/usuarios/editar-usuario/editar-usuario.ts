import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService } from '../../../../../services/usuario';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-editar-usuario',
  templateUrl: './editar-usuario.html',
  standalone: false
})
export class EditarUsuario implements OnInit {

  editarForm!: FormGroup;
  uid: string = '';
  cargando: boolean = true;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.uid = this.route.snapshot.paramMap.get('id') || '';

    this.editarForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      ci: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['']
    });

    if (this.uid) {
      this.cargarDatosUsuario();
    } else {
      alert("Error: No se detectó un ID de usuario válido.");
      this.cargando = false;
      // --- RUTA CORREGIDA SEGÚN TU CONFIGURACIÓN ---
      this.router.navigate(['/admin/usuarios']); 
    }
  }

  async cargarDatosUsuario() {
    this.cargando = true;
    this.cdr.detectChanges();

    try {
      const usuario: any = await firstValueFrom(
        this.usuarioService.obtenerUsuario(this.uid).pipe(take(1))
      );

      if (usuario) {
        this.editarForm.patchValue({
          nombre: usuario.nombre || '',
          apellido: usuario.apellido || '',
          ci: usuario.ci || '',
          email: usuario.email || '',
          telefono: usuario.telefono || ''
        });
      } else {
        alert("El usuario no existe en la base de datos.");
        this.router.navigate(['/admin/usuarios']);
      }
    } catch (error) {
      console.error("Error cargando:", error);
      alert('Error al cargar usuario.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  async guardarCambios() {
    if (this.editarForm.invalid) {
      this.editarForm.markAllAsTouched();
      return;
    }

    const rawValues = this.editarForm.value;

    // Limpieza para evitar 'undefined' en Firestore
    const datosLimpios = {
      nombre: rawValues.nombre || '',
      apellido: rawValues.apellido || '',
      ci: rawValues.ci || '',
      email: rawValues.email || '',
      telefono: rawValues.telefono || ''
    };

    try {
      await this.usuarioService.actualizarDatosUsuario(this.uid, datosLimpios);
      alert('Usuario actualizado correctamente');
      
      // --- NAVEGACIÓN EXITOSA HACIA LA LISTA ---
      this.router.navigate(['/admin/usuarios']); 
    } catch (error) {
      console.error("Error al guardar:", error);
      alert('Error al guardar los cambios');
    }
  }

  cancelar() {
    // --- VUELVE A LA LISTA DE USUARIOS ---
    this.router.navigate(['/admin/usuarios']);
  }
}