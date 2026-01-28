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

  // Crear un usuario base (sin auth)
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

  // Obtener un solo usuario por UID
  obtenerUsuario(uid: string) {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection('usuarios')
        .doc(uid)
        .valueChanges();
    });
  }

  // Obtener lista completa de usuarios (CORREGIDO PARA TABLA)
  obtenerUsuarios(): Observable<UsuarioModelo[]> {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection<UsuarioModelo>('usuarios')
        .snapshotChanges() // Usamos snapshot para obtener el ID y metadata
        .pipe(
          map(actions =>
            actions.map(a => {
              const data = a.payload.doc.data() as any;
              const uid = a.payload.doc.id;

              // Conversión de Fecha: Firebase Timestamp -> JS Date
              let fechaReal = data.fechaRegistro;
              // Si es un Timestamp de Firebase (tiene seconds), lo convertimos
              if (data.fechaRegistro && data.fechaRegistro.seconds) {
                fechaReal = new Date(data.fechaRegistro.seconds * 1000);
              }

              return {
                uid: uid, // Aseguramos que el UID vaya en el objeto
                ...data,
                fechaRegistro: fechaReal // Ponemos la fecha ya convertida
              };
            })
          )
        );
    });
  }

  // Cambiar rol (Admin/Usuario/Cliente)
  cambiarRol(uid: string, rol: string) {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection('usuarios')
        .doc(uid)
        .update({ rol });
    });
  }

  // Activar o desactivar usuario
  desactivarUsuario(uid: string, activo: boolean) {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection('usuarios')
        .doc(uid)
        .update({ activo });
    });
  }

  // Buscar usuario por CI (Para validaciones)
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

  // Registrar usuario completo (Auth + Firestore)
  async registrarUsuario(
    email: string,
    password: string,
    datos: UsuarioCrear
  ): Promise<void> {

    // 1️⃣ Crear usuario en Firebase Auth
    const cred = await this.afAuth.createUserWithEmailAndPassword(email, password);

    if (!cred.user) {
      throw new Error('No se pudo crear el usuario en Auth');
    }

    const uid = cred.user.uid;

    // 2️⃣ Guardar usuario en Firestore
    await runInInjectionContext(this.injector, async () => {
      await this.firestore
        .collection('usuarios')
        .doc(uid)
        .set({
          nombre: datos.nombre,
          apellido: datos.apellido,
          ci: datos.ci,
          rol: datos.rol,
          email: email,
          activo: true,
          telefono: '',
          fechaRegistro: new Date()
        });
    });
  }

  // Actualizar datos personales (Nombre, CI, etc.)
  actualizarDatosUsuario(uid: string, datos: any): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      // Filtramos para que NO se pueda tocar el rol desde aquí por seguridad
      const { rol, ...datosEditables } = datos;
      return this.firestore.collection('usuarios').doc(uid).update(datosEditables);
    });
  }
}