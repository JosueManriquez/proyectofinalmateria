import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Suscripcion {
  id?: string;
  uidUsuario: string;
  tipo: 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL';
  fechaInicio: Date;
  fechaFin: Date;
  activa: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SuscripcionService {

  constructor(private firestore: AngularFirestore, private injector: Injector) {}

  obtenerSuscripcionActiva(uidUsuario: string): Observable<Suscripcion | null> {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection<Suscripcion>('suscripciones', ref =>
          ref.where('uidUsuario', '==', uidUsuario)
             .where('activa', '==', true)
        )
        .valueChanges({ idField: 'id' })
        .pipe(map(arr => arr.length ? arr[0] : null));
    });
  }
}
