import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';

import { UsuarioService, UsuarioCrear } from './usuario';

export interface SuscripcionModelo {
  id?: string;
  uidUsuario: string; // CI del usuario
  tipo: 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL';
  fechaInicio: Date;
  fechaFin: Date;
  activa: boolean;
  usuario?: UsuarioCrear; // opcional: datos completos del usuario
}

@Injectable({
  providedIn: 'root'
})
export class SuscripcionService {
  constructor(
    private firestore: AngularFirestore,
    private injector: Injector,
    private usuarioService: UsuarioService
  ) {}

  // Listar todas las suscripciones
  listarSuscripciones(): Observable<SuscripcionModelo[]> {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection<SuscripcionModelo>('suscripciones', ref => ref.orderBy('fechaInicio', 'desc'))
        .valueChanges({ idField: 'id' });
    });
  }

async crearSuscripcion(sus: SuscripcionModelo): Promise<void> {
  // Primero, obtener el usuario por CI usando UsuarioService
  const usuario = await firstValueFrom(this.usuarioService.obtenerUsuarioPorCI(sus.uidUsuario));

  if (!usuario) {
    throw new Error('El CI ingresado no existe en la colección de usuarios');
  }

  // Crear ID de la suscripción
  const id = this.firestore.createId();

  // Guardar la suscripción en Firestore
  return runInInjectionContext(this.injector, () => {
    return this.firestore.collection('suscripciones').doc(id).set({
      ...sus,
      activa: true,
      usuario
    });
  });
}


  // Actualizar suscripción existente
  actualizarSuscripcion(id: string, datos: Partial<SuscripcionModelo>) {
    return runInInjectionContext(this.injector, () => {
      return this.firestore.collection('suscripciones').doc(id).update(datos);
    });
  }

  // Activar o desactivar
  activarDesactivar(id: string, estado: boolean) {
    return runInInjectionContext(this.injector, () => {
      return this.firestore.collection('suscripciones').doc(id).update({ activa: estado });
    });
  }

  // Eliminar
  eliminarSuscripcion(id: string) {
    return runInInjectionContext(this.injector, () => {
      return this.firestore.collection('suscripciones').doc(id).delete();
    });
  }

  // Obtener suscripción activa de un usuario
  obtenerSuscripcionActiva(uidUsuario: string): Observable<SuscripcionModelo | null> {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection<SuscripcionModelo>('suscripciones', ref =>
          ref.where('uidUsuario', '==', uidUsuario)
             .where('activa', '==', true)
        )
        .valueChanges({ idField: 'id' })
        .pipe(map(arr => arr.length ? arr[0] : null));
    });
  }
}



/*   obtenerSuscripcionActiva(uidUsuario: string): Observable<Suscripcion | null> {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection<Suscripcion>('suscripciones', ref =>
          ref.where('uidUsuario', '==', uidUsuario)
             .where('activa', '==', true)
        )
        .valueChanges({ idField: 'id' })
        .pipe(map(arr => arr.length ? arr[0] : null));
    });
  } */

