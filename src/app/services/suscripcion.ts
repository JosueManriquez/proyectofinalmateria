import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { SuscripcionModelo } from '../models/suscripcion';
import { UsuarioModelo } from '../models/usuario.model';
import { Observable } from 'rxjs';
import { map, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SuscripcionService {

  constructor(
    private afs: AngularFirestore,
    private injector: Injector
  ) {}

  // Crear suscripción
  crearSuscripcion(suscripcion: SuscripcionModelo): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      const id = this.afs.createId();
      return this.afs.collection('suscripciones').doc(id).set({ ...suscripcion });
    });
  }

  // Listar todas las suscripciones
  listarSuscripciones(): Observable<SuscripcionModelo[]> {
    return runInInjectionContext(this.injector, () => {
      return this.afs.collection<SuscripcionModelo>('suscripciones')
        .valueChanges({ idField: 'id' });
    });
  }

  // Actualizar suscripción
  actualizarSuscripcion(id: string, suscripcion: SuscripcionModelo): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      return this.afs.collection('suscripciones').doc(id).update(suscripcion);
    });
  }

  // Eliminar suscripción
  eliminarSuscripcion(id: string): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      return this.afs.collection('suscripciones').doc(id).delete();
    });
  }

  // Activar o desactivar suscripción
  activarDesactivar(id: string, activa: boolean): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      return this.afs.collection('suscripciones').doc(id).update({ activa });
    });
  }

  // Validar existencia de usuario por CI
  validarCI(ci: string): Observable<boolean> {
    return runInInjectionContext(this.injector, () => {
      return this.afs.collection<UsuarioModelo>('usuarios', ref => ref.where('ci', '==', ci))
        .valueChanges()
        .pipe(
          map(usuarios => usuarios.length > 0),
          first()
        );
    });
  }

  // Obtener suscripción activa de un usuario (Para el Ingreso)
  obtenerSuscripcionActiva(ciUsuario: string): Observable<SuscripcionModelo | null> {
    return runInInjectionContext(this.injector, () => {
      return this.afs.collection<SuscripcionModelo>('suscripciones', ref =>
        ref.where('UsuarioModeloCi', '==', ciUsuario)
           .where('activa', '==', true)
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        map(arr => arr.length ? arr[0] : null),
        first()
      );
    });
  }

  // Obtener usuario por CI
  obtenerUsuarioPorCI(ci: string): Observable<UsuarioModelo | null> {
    return runInInjectionContext(this.injector, () => {
      return this.afs.collection<UsuarioModelo>('usuarios', ref =>
        ref.where('ci', '==', ci)
      )
      .valueChanges()
      .pipe(
        map(arr => arr.length ? arr[0] : null),
        first()
      );
    });
  }

  // Obtener la última suscripción
  obtenerUltimaSuscripcion(ciUsuario: string): Observable<SuscripcionModelo | null> {
    return runInInjectionContext(this.injector, () => {
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
    });
  }

  // Obtener Historial (Para la renovación)
  obtenerHistorialPorCI(ci: string): Observable<SuscripcionModelo[]> {
    return runInInjectionContext(this.injector, () => {
      return this.afs.collection<SuscripcionModelo>('suscripciones', ref =>
        ref.where('UsuarioModeloCi', '==', ci)
           .orderBy('fechaFin', 'desc')
      )
      .valueChanges({ idField: 'id' });
    });
  }

  // Renovar suscripción
  // Nota: Como este método llama a otros que ya tienen el contexto inyectado,
  // el wrapper principal asegura que la lógica de negocio se mantenga en el contexto.
  async renovarSuscripcion(
    suscripcionAnterior: SuscripcionModelo,
    tipo: 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL',
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<SuscripcionModelo> {
    
    return runInInjectionContext(this.injector, async () => {
      
      // 1. Desactivar anterior
      if (suscripcionAnterior.activa && suscripcionAnterior.id) {
        await this.activarDesactivar(suscripcionAnterior.id, false);
      }

      // 2. Crear nueva
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
    });
  }
}