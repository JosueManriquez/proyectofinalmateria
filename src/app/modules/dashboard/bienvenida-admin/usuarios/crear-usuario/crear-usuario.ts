import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuarioService, UsuarioCrear } from '../../../../../services/usuario';
import { Router } from '@angular/router';

@Component({
  selector: 'app-crear-usuario',
  templateUrl: './crear-usuario.html',
  styleUrls: ['./crear-usuario.css'],
  standalone: false
})
export class CrearUsuario implements OnInit {

  crearForm!: FormGroup;
  cargando: boolean = false;
  verPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.crearForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      apellido: ['', Validators.required],
      ci: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]], // Solo números
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rol: ['usuario', Validators.required]
    });
  }

  async crear() {
    if (this.crearForm.invalid) {
      this.crearForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const { nombre, apellido, ci,telefono, email, password, rol } = this.crearForm.value;

    const datos: UsuarioCrear = {
      nombre,
      apellido,
      ci,
      telefono,
      rol
    };

    try {
      await this.usuarioService.registrarUsuario(email, password, datos);
      alert('Usuario creado correctamente');
      this.router.navigate(['/admin/usuarios']);
    } catch (error: any) {
      console.error(error);
      let mensaje = 'Error al crear el usuario';
      if (error.code === 'auth/email-already-in-use') {
        mensaje = 'El correo ya está registrado.';
      }
      alert(mensaje);
    } finally {
      this.cargando = false;
    }
  }

  togglePassword() {
    this.verPassword = !this.verPassword;
  }
}