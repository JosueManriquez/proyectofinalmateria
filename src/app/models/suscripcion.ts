export interface SuscripcionModelo {
  UsuarioModeloCi: string;
  UsuarioModeloApellido: string;
  id?: string;
  tipo: string; 
  precioPagado: number;
  fechaInicio: Date; // Cuándo empieza a entrenar
  fechaFin: Date;    // Cuándo termina
  fechaPago: Date;   // <--- NUEVO: Cuándo pagó realmente (Flujo de Caja)
  activa: boolean;
}