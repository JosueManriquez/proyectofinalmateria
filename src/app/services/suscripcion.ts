import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { SuscripcionModelo } from '../models/suscripcion';
import { UsuarioModelo } from '../models/usuario.model';
import { PlanModelo } from '../models/plan.model';
import { Observable } from 'rxjs';
import { map, first, finalize } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Injectable({
  providedIn: 'root'
})
export class SuscripcionService {

  constructor(
    private afs: AngularFirestore,
    private injector: Injector,
    private storage: AngularFireStorage,
  ) { }

  // Crear suscripción
  crearSuscripcion(suscripcion: SuscripcionModelo): Promise<void> {
  return runInInjectionContext(this.injector, () => {
    return this.afs.collection('suscripciones').add(suscripcion)
      .then(() => { /* éxito */ });
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
    tipo: string,        // Cambiado a string para aceptar nombres de planes personalizados
    precio: number,      // <--- NUEVO PARAMETRO OBLIGATORIO
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<SuscripcionModelo> {

    return runInInjectionContext(this.injector, async () => {

      // 1. Desactivar anterior
      if (suscripcionAnterior.activa && suscripcionAnterior.id) {
        await this.activarDesactivar(suscripcionAnterior.id, false); // Asumiendo que tienes este método
      }

      // 2. Crear nueva
      const nuevaSuscripcion: SuscripcionModelo = {
        UsuarioModeloCi: suscripcionAnterior.UsuarioModeloCi,
        UsuarioModeloApellido: suscripcionAnterior.UsuarioModeloApellido,
        tipo,
        precioPagado: precio, // <--- AQUI SE ASIGNA EL PRECIO
        fechaInicio,
        fechaFin,
        fechaPago: new Date(),
        activa: true,
      };

      await this.crearSuscripcion(nuevaSuscripcion);
      return nuevaSuscripcion;
    });
  }
  obtenerHistorialGlobal(): Observable<SuscripcionModelo[]> {
    return runInInjectionContext(this.injector, () => {
      return this.afs
        .collection<SuscripcionModelo>('suscripciones')
        .valueChanges({ idField: 'id' });
    });
  }
  obtenerPlanesActivos(): Observable<PlanModelo[]> {
    return runInInjectionContext(this.injector, () => {
      return this.afs.collection<PlanModelo>('planes', ref =>
        ref.where('activo', '==', true).orderBy('precio', 'asc')
      ).valueChanges({ idField: 'id' });
    });
  }
  crearPlan(plan: PlanModelo): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      const id = this.afs.createId();
      return this.afs.collection('planes').doc(id).set({ ...plan });
    });
  }

  // Actualizar un plan existente
  actualizarPlan(id: string, data: Partial<PlanModelo>): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      return this.afs.collection('planes').doc(id).update(data);
    });
  }

  obtenerTodosLosPlanes(): Observable<PlanModelo[]> {
    return runInInjectionContext(this.injector, () => {
      return this.afs.collection<PlanModelo>('planes', ref =>
        ref.orderBy('activo', 'desc').orderBy('precio', 'asc')
      ).valueChanges({ idField: 'id' });
    });
  }
  subirImagen(archivo: File, nombre: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const filePath = `planes/${Date.now()}_${nombre}`; // Evita nombres duplicados
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, archivo);

      task.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe(url => {
            resolve(url);
          }, err => reject(err));
        })
      ).subscribe();
    });
  }
  eliminarImagen(url: string): Promise<void> {
    return new Promise((resolve) => {
      // Si no hay URL, no hay nada que borrar
      if (!url) { resolve(); return; }

      try {
        // refFromURL es mágico: extrae la ruta del archivo desde el link largo
        const ref = this.storage.storage.refFromURL(url);

        ref.delete()
          .then(() => {
            console.log("Imagen antigua eliminada correctamente");
            resolve();
          })
          .catch((err) => {
            // Si falla (ej. el archivo ya no existía), no queremos romper la app
            console.warn("No se pudo eliminar la imagen antigua:", err);
            resolve();
          });
      } catch (e) {
        console.error("Error al procesar URL de imagen:", e);
        resolve();
      }
    });
  }
}