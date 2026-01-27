import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { SuscripcionModelo } from '../models/suscripcion';
import { UsuarioModelo } from '../models/usuario.model';
import { Observable, firstValueFrom } from 'rxjs';
import { map, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SuscripcionService {

  constructor(private afs: AngularFirestore) {}

  // Crear suscripción
  crearSuscripcion(suscripcion: SuscripcionModelo): Promise<void> {
    const id = this.afs.createId();
    return this.afs.collection('suscripciones').doc(id).set({ ...suscripcion });
  }

  // Listar todas las suscripciones
  listarSuscripciones(): Observable<SuscripcionModelo[]> {
    return this.afs.collection<SuscripcionModelo>('suscripciones')
      .valueChanges({ idField: 'id' }); // agrega el id automáticamente
  }

  // Actualizar suscripción
  actualizarSuscripcion(id: string, suscripcion: SuscripcionModelo): Promise<void> {
    return this.afs.collection('suscripciones').doc(id).update(suscripcion);
  }

  // Eliminar suscripción
  eliminarSuscripcion(id: string): Promise<void> {
    return this.afs.collection('suscripciones').doc(id).delete();
  }

  // Activar o desactivar suscripción
  activarDesactivar(id: string, activa: boolean): Promise<void> {
    return this.afs.collection('suscripciones').doc(id).update({ activa });
  }

  // Validar existencia de usuario por CI
  validarCI(ci: string): Observable<boolean> {
    return this.afs.collection<UsuarioModelo>('usuarios', ref => ref.where('ci', '==', ci))
      .valueChanges()
      .pipe(
        map(usuarios => usuarios.length > 0),
        first()
      );
  }

  // Obtener suscripción activa de un usuario
  obtenerSuscripcionActiva(ciUsuario: string): Observable<SuscripcionModelo | null> {
    return this.afs.collection<SuscripcionModelo>('suscripciones', ref =>
      ref.where('UsuarioModeloCi', '==', ciUsuario)
         .where('activa', '==', true)
    )
    .valueChanges({ idField: 'id' })
    .pipe(
      map(arr => arr.length ? arr[0] : null),
      first()
    );
  }

  // Obtener usuario por CI
  obtenerUsuarioPorCI(ci: string): Observable<UsuarioModelo | null> {
    return this.afs.collection<UsuarioModelo>('usuarios', ref =>
      ref.where('ci', '==', ci)
    )
    .valueChanges()
    .pipe(
      map(arr => arr.length ? arr[0] : null),
      first()
    );
  }

  // Obtener la última suscripción (por fechaFin más reciente)
  obtenerUltimaSuscripcion(ciUsuario: string): Observable<SuscripcionModelo | null> {
    return this.afs.collection<SuscripcionModelo>('suscripciones', ref =>
      ref.where('UsuarioModeloCi', '==', ciUsuario)
         .orderBy('fechaFin', 'desc')
         .limit(1)
    )
    .valueChanges({ idField: 'id' })
    .pipe(
      map(arr => arr.length ? arr[0] : null),
      first()
    );
  }

  // Renovar suscripción: desactiva la anterior y crea una nueva
  async renovarSuscripcion(
    suscripcionAnterior: SuscripcionModelo,
    tipo: 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL',
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<SuscripcionModelo> {

    // 1️⃣ Desactivar la anterior si está activa
    if (suscripcionAnterior.activa && suscripcionAnterior.id) {
      await this.activarDesactivar(suscripcionAnterior.id, false);
    }

    // 2️⃣ Crear la nueva suscripción
    const nuevaSuscripcion: SuscripcionModelo = {
      UsuarioModeloCi: suscripcionAnterior.UsuarioModeloCi,
      UsuarioModeloApellido: suscripcionAnterior.UsuarioModeloApellido,
      tipo,
      fechaInicio,
      fechaFin,
      activa: true
    };

    await this.crearSuscripcion(nuevaSuscripcion);
    return nuevaSuscripcion;
  }

}
