export interface ProductoModelo {
    id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  categoriaId: string;
  activo: boolean;
  creadoEn: Date;
}
