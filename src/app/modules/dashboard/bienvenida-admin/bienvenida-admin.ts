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
  ) {}

  cerrarSesion() {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }
}
