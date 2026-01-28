import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bienvenida-admin',
  standalone: false,
  templateUrl: './bienvenida-admin.html',
  styleUrl: './bienvenida-admin.css',
})
export class BienvenidaAdmin {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  cerrarSesion() {
    this.authService.logout().then(() => {
      // TRUCO: En lugar de usar el router de Angular, forzamos una recarga del navegador.
      // Esto limpia la memoria RAM, variables y cualquier estado "pegado".
      window.location.href = '/login';
    });
  }
}
