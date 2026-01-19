import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registrar',
  standalone: false,
  templateUrl: './registrar.html',
  styleUrl: './registrar.css',
})
export class Registrar {
  email: string = '';
  password: string = '';
  constructor(private authService: AuthService, private router: Router) { }

  registrar() {
    this.authService
      .registrar(this.email, this.password)
      .then((user) => {
        console.log('Registro exitoso', user.user?.email);
      })
      .catch((error) => {
        console.error('Error en registro:', error);
      });
  }
  irLogin() {
    this.router.navigate(['/login']);
  }
}
