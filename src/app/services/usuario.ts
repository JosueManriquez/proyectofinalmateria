import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UsuarioModelo } from '../models/usuario.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';


export interface UsuarioCrear {
  nombre: string;
  apellido: string;
  ci: string;
  rol: 'admin' | 'usuario' | 'cliente';
}
@Injectable({
  providedIn: 'root',
})
export class UsuarioService {

  constructor(
    private firestore: AngularFirestore,
    private injector: Injector,
    private afAuth: AngularFireAuth
  ) { }

  crearUsuario(uid: string, email: string) {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection('usuarios')
        .doc(uid)
        .set({
          email,
          rol: 'usuario',
          activo: true,
          nombre: '',
          apellido: '',
          ci: '',
          telefono: '',
          fechaRegistro: new Date(),
        });

    });
  }

  obtenerUsuario(uid: string) {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection('usuarios')
        .doc(uid)
        .valueChanges();
    });
  }

  obtenerUsuarios(): Observable<UsuarioModelo[]> {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection<UsuarioModelo>('usuarios')
        .snapshotChanges()
        .pipe(
          map(actions =>
            actions.map(a => {
              const data = a.payload.doc.data() as UsuarioModelo;
              const uid = a.payload.doc.id;
              return { ...data, uid };
            })
          )
        );
    });
  }

  cambiarRol(uid: string, rol: string) {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection('usuarios')
        .doc(uid)
        .update({ rol });
    });
  }
  desactivarUsuario(uid: string, activo: boolean) {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection('usuarios')
        .doc(uid)
        .update({ activo }); //inge lo tiene en estado  
    });
  }
  obtenerUsuarioPorCI(ci: string): Observable<UsuarioModelo | null> {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection<UsuarioModelo>('usuarios', ref => ref.where('ci', '==', ci))
        .valueChanges({ idField: 'uid' })
        .pipe(
          map(users => users.length ? users[0] : null)
        );
    });
  }
  async registrarUsuario(email: string, password: string, datos: UsuarioCrear) {
    // 1️⃣ Crear usuario en Firebase Auth
    const cred = await this.afAuth.createUserWithEmailAndPassword(email, password);
    const uid = cred.user?.uid || '';
  }
}

