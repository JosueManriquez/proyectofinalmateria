import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../services/usuario';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  login() {
    this.authService
      .login(this.email, this.password)
      .then((cred) => {
        const uid = cred.user?.uid || '';
        debugger;
        this.authService.ObtenerUsuario(uid).subscribe((usuario:any)=> {
       console.log('Usuario": ' ,usuario);

          if (usuario.rol === 'admin'){
            this.router.navigate(['/admin']);
          }
          else{
            this.router.navigate(['/usuario']);
            console.error('Usuario no activo')
          }
        })

      })
      .catch((error) => {
        console.error('error de login', error);
      });
  }
  nuevoRegistro() {
    this.router.navigate(['/registrar']);
  }

}

