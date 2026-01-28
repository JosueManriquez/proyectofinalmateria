import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService } from '../../../../../services/usuario';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators'; // 👈 FALTABA ESTA IMPORTACIÓN

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
    // 1. Obtener ID
    this.uid = this.route.snapshot.paramMap.get('id') || '';

    // 2. Iniciar Formulario
    this.editarForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      ci: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['']
    });

    // 3. Cargar datos si existe UID
    if (this.uid) {
      this.cargarDatosUsuario();
    } else {
      alert("Error: No se detectó un ID de usuario válido.");
      this.cargando = false;
      this.router.navigate(['/admin/usuarios']);
    }
  }

  async cargarDatosUsuario() {
    this.cargando = true;
    this.cdr.detectChanges(); // Forzar spinner

    try {
      console.log("Buscando usuario ID:", this.uid);

      // Usamos take(1) para que el Observable se complete y la Promesa se resuelva
      const usuario: any = await firstValueFrom(
        this.usuarioService.obtenerUsuario(this.uid).pipe(take(1))
      );

      console.log("Usuario encontrado:", usuario);

      if (usuario) {
        this.editarForm.patchValue({
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          ci: usuario.ci,
          email: usuario.email,
          telefono: usuario.telefono
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
      this.cdr.detectChanges(); // Quitar spinner
    }
  }

  async guardarCambios() {
    if (this.editarForm.invalid) {
      this.editarForm.markAllAsTouched();
      return;
    }

    try {
      await this.usuarioService.actualizarDatosUsuario(this.uid, this.editarForm.value);
      alert('Usuario actualizado correctamente');
      this.router.navigate(['/admin/usuarios']);
    } catch (error) {
      console.error(error);
      alert('Error al guardar los cambios');
    }
  }

  cancelar() {
    this.router.navigate(['/admin/usuarios']);
  }
}