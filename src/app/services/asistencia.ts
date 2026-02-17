import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

export interface Asistencia {
  id?: string;
  uidUsuario: string; // Relación con el usuario
  ciUsuario?: string; // Dato rápido para reportes
  fecha: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  constructor(private firestore: AngularFirestore, private injector: Injector) { }

  registrarEntrada(uidUsuario: string, ciUsuario: string) {
    const id = this.firestore.createId();
    const asistencia: Asistencia = {
      id,
      uidUsuario,
      ciUsuario,
      fecha: new Date()
    };

    return runInInjectionContext(this.injector, () =>
      this.firestore.collection('asistencias').doc(id).set(asistencia)
    );
  }

  // Obtiene la última asistencia registrada de un usuario (para validar doble ingreso)
  obtenerUltimaAsistencia(uid: string) {
    // CORRECCIÓN: Cambiamos 'idUsuario' por 'uidUsuario' para que coincida con tu modelo
    return this.firestore.collection('asistencias', ref =>
      ref.where('uidUsuario', '==', uid)
    ).get();
  }

}