export interface UsuarioModelo {
  uid?: string; // opcional
  nombre: string;
  apellido: string;
  ci: string;
  email: string;
  telefono: string;
  rol: 'admin' | 'usuario' | 'cliente';
  activo: boolean;
  fechaRegistro: any; // Firestore Timestamp o Date
}
