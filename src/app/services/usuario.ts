import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UsuarioModelo } from '../models/usuario.model';

// Interfaz necesaria para el admin
export interface UsuarioCrear {
  nombre: string;
  apellido: string;
  ci: string;
  rol: 'admin' | 'usuario' | 'cliente';
  email?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private injector: Injector // Inyectamos el Injector para usar el contexto
  ) { }

  // ==============================================================
  // 1. CREACIÓN
  // ==============================================================

  crearUsuario(usuario: UsuarioModelo): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection('usuarios')
        .doc(usuario.uid)
        .set(usuario);
    });
  }

  // Método compuesto (Auth + Firestore) para el panel Admin
  async registrarUsuario(email: string, pass: string, datos: UsuarioCrear): Promise<void> {
    // Auth no necesita contexto de inyección porque es una promesa directa del SDK
    const cred = await this.afAuth.createUserWithEmailAndPassword(email, pass);
    if (!cred.user) throw new Error('No se pudo crear el usuario en Auth');

    const nuevoUsuario: UsuarioModelo = {
      uid: cred.user.uid,
      nombre: datos.nombre,
      apellido: datos.apellido,
      ci: datos.ci,
      email: email,
      rol: datos.rol,
      activo: true,
      telefono: '',
      fechaRegistro: new Date()
    };

    // Reutilizamos crearUsuario que ya tiene el runInInjectionContext
    return this.crearUsuario(nuevoUsuario);
  }

  // ==============================================================
  // 2. LECTURAS
  // ==============================================================

  obtenerUsuario(uid: string): Observable<UsuarioModelo | undefined> {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection<UsuarioModelo>('usuarios')
        .doc(uid)
        .valueChanges();
    });
  }

  obtenerUsuarioPorCI(ci: string): Observable<UsuarioModelo | null> {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection<UsuarioModelo>('usuarios', ref => ref.where('ci', '==', String(ci)))
        .valueChanges({ idField: 'uid' })
        .pipe(map(users => users.length > 0 ? users[0] : null));
    });
  }

  obtenerUsuarios(): Observable<UsuarioModelo[]> {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection<UsuarioModelo>('usuarios')
        .snapshotChanges()
        .pipe(
          map(actions => actions.map(a => {
            const data = a.payload.doc.data() as any;
            const uid = a.payload.doc.id;

            let fechaReal = data.fechaRegistro;
            if (data.fechaRegistro && data.fechaRegistro.seconds) {
              fechaReal = new Date(data.fechaRegistro.seconds * 1000);
            }

            return { uid, ...data, fechaRegistro: fechaReal } as UsuarioModelo;
          }))
        );
    });
  }

  // ==============================================================
  // 3. MODIFICACIONES
  // ==============================================================

  cambiarRol(uid: string, rol: string): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection('usuarios')
        .doc(uid)
        .update({ rol });
    });
  }

  desactivarUsuario(uid: string, activo: boolean): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection('usuarios')
        .doc(uid)
        .update({ activo });
    });
  }

  actualizarDatosUsuario(uid: string, datos: Partial<UsuarioModelo>): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      const { rol, ...datosEditables } = datos as any;
      return this.firestore
        .collection('usuarios')
        .doc(uid)
        .update(datosEditables);
    });
    
  }
}