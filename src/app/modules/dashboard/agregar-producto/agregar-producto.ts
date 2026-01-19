import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ProductoService } from '../../../services/producto';
import { ProductoModelo } from '../../../models/producto';
import { CategoriaService } from '../../../services/categoria';
import { CategoriaModelo } from '../../../models/categoria';


@Component({
  selector: 'app-agregar-producto',
  templateUrl: './agregar-producto.html',
  standalone: false,
  styleUrl: './agregar-producto.css',
})
export class AgregarProducto implements OnInit {
  categorias: CategoriaModelo[] = [];

  producto: ProductoModelo = {
    nombre: '',
    descripcion: '',
    precio: 0,
    cantidad: 0,
    categoriaId: '',
    activo: true,
    creadoEn: new Date(),
  };

  constructor(
    private categoriaService: CategoriaService,
    private productoService: ProductoService,
    private cdr:ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.categoriaService.ObtenerCategorias().subscribe((data) => {
      this.categorias = data.filter(c => c.activo); // solo activas
      this.cdr.detectChanges();
    });
  }

  guardarProducto() {
    if (!this.producto.categoriaId) {
      alert('Selecciona una categoría');
      return;
    }

    this.productoService.agregarProducto(this.producto).then(() => {
      console.log('Producto guardado');
    });
  }
}
