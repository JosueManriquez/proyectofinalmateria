export interface UsuarioModelo {
  uid: string;
  nombre: string;    // agregado
  apellido: string;  // agregado
  ci: string;        // agregado
  email: string;
  rol: 'admin' | 'usuario' | 'cliente';
  activo: boolean;
}
