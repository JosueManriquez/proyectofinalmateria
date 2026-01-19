
import { Observable } from 'rxjs';

import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ProductoModelo } from '../models/producto';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  constructor(
    private firestore: AngularFirestore,
    private injector: Injector
  ) {}

  agregarProducto(producto: ProductoModelo) {
    const id = this.firestore.createId();

    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection('productos')
        .doc(id)
        .set({
          ...producto,
          creadoEn: new Date(),
          activo: true,
        });
    });
  }
   obtenerProductos() {
    return runInInjectionContext(this.injector, () => {
      return this.firestore
        .collection<ProductoModelo>('productos', ref => ref.orderBy('creadoEn', 'desc'))
        .valueChanges({ idField: 'id' });
    });
  }

  eliminarProducto(id: string) {
    return runInInjectionContext(this.injector, () => {
      return this.firestore.collection('productos').doc(id).delete();
    });
  }

  actualizarProducto(id: string, producto: Partial<ProductoModelo>) {
    return runInInjectionContext(this.injector, () => {
      return this.firestore.collection('productos').doc(id).update(producto);
    });
  }
}


