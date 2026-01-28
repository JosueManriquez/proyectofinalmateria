import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  email: string = '';
  password: string = '';
  
  // Variables para control visual
  cargando: boolean = false;
  mensajeError: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  login() {
    // Validar campos vacíos antes de enviar
    if (!this.email || !this.password) {
      this.mensajeError = 'Por favor completa todos los campos.';
      return;
    }

    this.cargando = true;
    this.mensajeError = ''; // Limpiar errores previos

    this.authService.login(this.email, this.password)
      .then((cred) => {
        const uid = cred.user?.uid || '';
        
        this.authService.ObtenerUsuario(uid).subscribe({
          next: (usuario: any) => {
            console.log('Usuario:', usuario);

            if (usuario && usuario.rol === 'admin') {
              this.router.navigate(['/admin']);
            } else {
              // Si es usuario normal o no tiene rol
              this.router.navigate(['/usuario']);
            }
            // No ponemos cargando = false aquí porque ya navegamos
          },
          error: (err) => {
            console.error(err);
            this.cargando = false;
            this.mensajeError = 'Error al obtener datos del usuario.';
          }
        });
      })
      .catch((error) => {
        console.error('Error de login', error);
        this.cargando = false;
        
        // Traducir errores comunes de Firebase
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          this.mensajeError = 'Correo o contraseña incorrectos.';
        } else if (error.code === 'auth/too-many-requests') {
          this.mensajeError = 'Demasiados intentos. Intenta más tarde.';
        } else {
          this.mensajeError = 'Ocurrió un error inesperado.';
        }
      });
  }

  nuevoRegistro() {
    this.router.navigate(['/registrar']);
  }
}