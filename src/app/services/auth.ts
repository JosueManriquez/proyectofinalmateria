import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { UsuarioService } from '../services/usuario';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth,
    private userService: UsuarioService) { }

  async registrar(email: string, pass: string) {
    const credencial = await this.afAuth.createUserWithEmailAndPassword(email, pass);

    // BORRA O COMENTA ESTA LÍNEA (Esto es lo que da error):
    // await this.userService.crearUsuario(credencial.user.uid, email); 

    return credencial;
  }
  login(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }
  logout() {
    return this.afAuth.signOut();
  }

  ObtenerUsuario(uid: string) {
    return this.userService.obtenerUsuario(uid);
  };

}

