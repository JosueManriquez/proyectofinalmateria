import {ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ProductoService } from '../../../services/producto';
import { CategoriaService } from '../../../services/categoria';
import { ProductoModelo } from '../../../models/producto';
import { CategoriaModelo } from '../../../models/categoria';

@Component({
  selector: 'app-gestionar-producto',
  templateUrl: './gestionar-producto.html',
   styleUrl: './gestionar-producto.css',
  standalone: false,
})
export class GestionarProducto implements OnInit {
  productos: ProductoModelo[] = [];
  categorias: CategoriaModelo[] = [];

  // Edición
  productoEditando: string | null = null;
  nombreEditado: string = '';
  descripcionEditado: string = '';
  precioEditado: number = 0;
  cantidadEditado: number = 0;
  categoriaIdEditado: string = '';

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Obtener productos
    this.productoService.obtenerProductos().subscribe((data) => {
      
      this.productos = data;
      this.cdr.detectChanges();
      
    });

    // Obtener categorías para mostrar nombre
    this.categoriaService.ObtenerCategorias().subscribe((data) => {
      this.categorias = data;
      this.cdr.detectChanges();
    });
  }

  // EDITAR
  editarProducto(producto: ProductoModelo) {
    this.productoEditando = producto.id!;
    this.nombreEditado = producto.nombre;
    this.descripcionEditado = producto.descripcion;
    this.precioEditado = producto.precio;
    this.cantidadEditado = producto.cantidad;
    this.categoriaIdEditado = producto.categoriaId;
  }

  guardarEdicion(producto: ProductoModelo) {
    if (!this.productoEditando) return;

    this.productoService
      .actualizarProducto(producto.id!, {
        nombre: this.nombreEditado,
        descripcion: this.descripcionEditado,
        precio: this.precioEditado,
        cantidad: this.cantidadEditado,
        categoriaId: this.categoriaIdEditado,
      })
      .then(() => {
        console.log('Producto actualizado');
        this.productoEditando = null;
        this.cdr.detectChanges();
      });
  }

  cancelarEdicion() {
    this.productoEditando = null;
  }

  // ELIMINAR
  eliminarProducto(id: string) {
    if (confirm('eliminar este producto?')) {
      this.productoService.eliminarProducto(id).then(() => {
        console.log('Producto eliminado');
        this.cdr.detectChanges();
      });
    }
  }

  obtenerNombreCategoria(categoriaId: string) {
    const cat = this.categorias.find((c) => c.id === categoriaId);
    return cat ? cat.nombre : 'Sin categoría';
  }
}
