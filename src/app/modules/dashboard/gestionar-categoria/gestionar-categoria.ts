import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CategoriaService } from '../../../services/categoria';
import { CategoriaModelo } from '../../../models/categoria';


@Component({
  selector: 'app-gestionar-categoria',
  standalone: false,
  templateUrl: './gestionar-categoria.html',
  styleUrl: './gestionar-categoria.css',
})
export class GestionarCategoria implements OnInit {
  categorias: CategoriaModelo[] = [];
  nuevaCategoria: CategoriaModelo = {
    nombre: '',
    descripcion: '',
    activo: true,
    creadoEn: new Date(),
  };

  categoriaEditando: string | null = null;
  nombreEditado: string = '';
  descripcionEditada: string = '';
  constructor(private categoriaService: CategoriaService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.categoriaService
      .ObtenerCategorias()
      .subscribe((categorias: CategoriaModelo[]) => {
        this.categorias = categorias;
        this.cdr.detectChanges();
      })
  }

  guardarCategoria() {
    this.categoriaService.agregarCategorias(this.nuevaCategoria).then(() => {
      console.log('categotia agregada')
    })
  }

  editarCategoria(categoria: CategoriaModelo) {
    this.categoriaEditando = categoria.id!;
    this.nombreEditado = categoria.nombre;
    this.descripcionEditada = categoria.descripcion;
  }

  guardarEdicion(categoria: CategoriaModelo) {
    this.categoriaService.actualizarCategoria(categoria.id!, {
      nombre: this.nombreEditado,
      descripcion: this.descripcionEditada,
      activo: categoria.activo,
      creadoEn: categoria.creadoEn,
    })
      .then(() => {
        console.log('categoria actualizada')
      })
    this.categoriaEditando = null;
  }

  cancelarEdicion() {
    this.categoriaEditando = null;

  }

  eliminarCategoria(id: string) {
    if (confirm('estas seguro de eliminar la categoria?'))
      this.categoriaService.eliminarCategoria(id).then(() => {
        console.log('categoria eliminada')
      })
  }

  alterarCategoria(categoria: CategoriaModelo) {
      if (!categoria.id) return;
  
      const nuevoEstado = !categoria.activo;
  
      this.categoriaService
        .desactivarCategoria(categoria.id, nuevoEstado)
        .then(() => {
          categoria.activo = nuevoEstado;
        });
    }

  /* cambiarEstado(usuario: UsuarioModelo): void {
      debugger;
      if (!usuario.uid) return;
  
      const nuevoEstado = !usuario.activo;
  
      this.usuarioService
        .desactivarUsuario(usuario.uid, nuevoEstado)
        .then(() => {
          usuario.activo = nuevoEstado;
        });
    } */


}
