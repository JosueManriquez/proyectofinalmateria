import { Component } from '@angular/core';
import { UsuarioService, UsuarioCrear } from '../../../../../services/usuario';
import { Router } from '@angular/router';

@Component({
  selector: 'app-crear-usuario',
  templateUrl: './crear-usuario.html',
  styleUrls: ['./crear-usuario.css'],
  standalone: false
})
export class CrearUsuario {

  nombre: string = '';
  apellido: string = '';
  ci: string = '';
  email: string = '';
  password: string = '';
  rol: 'admin' | 'usuario' | 'cliente' = 'usuario';

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  async crear() {
    if (!this.nombre || !this.apellido || !this.ci || !this.email || !this.password) {
      alert('Todos los campos son obligatorios');
      return;
    }

    const datos: UsuarioCrear = {
      nombre: this.nombre,
      apellido: this.apellido,
      ci: this.ci,
      rol: this.rol
    };

    try {
      await this.usuarioService.registrarUsuario(this.email, this.password, datos);
      alert('Usuario creado correctamente');
      this.router.navigate(['/admin/usuarios']);
    } catch (error) {
      console.error(error);
      alert('Error al crear el usuario');
    }
  }
}
