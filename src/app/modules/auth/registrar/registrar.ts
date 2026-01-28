import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { UsuarioService } from '../../../services/usuario'; // Necesitamos esto para guardar los datos
import { Router } from '@angular/router';
import { UsuarioModelo } from '../../../models/usuario.model'; // Tu modelo

@Component({
  selector: 'app-registrar',
  standalone: false,
  templateUrl: './registrar.html',
  styleUrl: './registrar.css',
})
export class Registrar {
  // Campos del formulario (Coinciden con tu modelo)
  nombre: string = '';
  apellido: string = '';
  ci: string = '';
  telefono: string = '';
  email: string = '';
  password: string = '';

  // Control visual
  cargando: boolean = false;
  mensajeError: string = '';

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private router: Router
  ) { }

  async registrar() {
    // 1. Validar que todo esté lleno
    if (!this.nombre || !this.apellido || !this.ci || !this.email || !this.password) {
      this.mensajeError = 'Por favor completa todos los campos obligatorios.';
      return;
    }

    if (this.password.length < 6) {
      this.mensajeError = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    try {
      // 2. Crear usuario en Firebase Authentication (Email/Pass)
      const credencial = await this.authService.registrar(this.email, this.password);
      const uid = credencial.user?.uid;

      if (uid) {
        // 3. Preparar el objeto según tu UsuarioModelo
        const nuevoUsuario: UsuarioModelo = {
          uid: uid,
          nombre: this.nombre,
          apellido: this.apellido,
          ci: this.ci,
          email: this.email,
          telefono: this.telefono || '', // Opcional
          rol: 'cliente', // Por defecto quien se registra es cliente
          activo: true,   // Nace activo
          fechaRegistro: new Date()
        };

        // 4. Guardar en Firestore
        // (Asumo que tu UsuarioService tiene un método crearUsuario o similar)
        await this.usuarioService.crearUsuario(nuevoUsuario);

        console.log('Registro exitoso y guardado en BD');
        
        // 5. Redirigir
        // Puedes mandarlo directo al panel o pedirle que inicie sesión
        this.router.navigate(['/usuario']); 
      }

    } catch (error: any) {
      console.error('Error en registro:', error);
      this.cargando = false;

      // Mensajes de error amigables
      if (error.code === 'auth/email-already-in-use') {
        this.mensajeError = 'El correo ya está registrado.';
      } else if (error.code === 'auth/weak-password') {
        this.mensajeError = 'La contraseña es muy débil.';
      } else {
        this.mensajeError = 'Error al registrar. Inténtalo de nuevo.';
      }
    }
  }

  irLogin() {
    this.router.navigate(['/login']);
  }
}