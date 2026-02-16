export interface SuscripcionModelo {
  UsuarioModeloCi: string;
  UsuarioModeloApellido: string;

  id?: string;
  // Cambiamos 'tipo' para que acepte cualquier string (el nombre del plan)
  tipo: string; 
  precioPagado: number; // NUEVO: Para tus reportes de ganancias
  fechaInicio: Date;
  fechaFin: Date;
  activa: boolean;
}