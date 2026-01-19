import { Injectable, runInInjectionContext, Injector } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CategoriaModelo } from '../models/categoria';



@Injectable({
  providedIn: 'root',
})
export class CategoriaService {
  constructor(private firestore: AngularFirestore, private Injector: Injector
  ) { }


  ObtenerCategorias() {
    return runInInjectionContext(this.Injector, () => {
      return this.firestore
        .collection<CategoriaModelo>('categorias')
        .valueChanges({ idField: 'id' });
    })
  }

  agregarCategorias(categoria: CategoriaModelo) {
    const id = this.firestore.createId();
    return runInInjectionContext(this.Injector, () => {
      return this.firestore
        .collection('categorias')
        .doc(id)
        .set({
          ...categoria,
          activo: true,
          creadoEn: new Date(),
        })

    })
  }
  eliminarCategoria(id: string) {
    return runInInjectionContext(this.Injector, () => {
      return this.firestore.collection('categorias').doc(id).delete();
    })

  }
  
  actualizarCategoria(id:string, categoria:CategoriaModelo){
    return runInInjectionContext(this.Injector, () => {
      return this.firestore
      .collection('categorias')
      .doc(id)
      .update(categoria)
    })
  }




  desactivarCategoria(uid: string, activo: boolean) {
    return runInInjectionContext(this.Injector, () => {
      return this.firestore
        .collection('categorias')
        .doc(uid)
        .update({ activo }); //inge lo tiene en estado  
    });
  }

}
