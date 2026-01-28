export interface SuscripcionModelo {
  UsuarioModeloCi: string;
  UsuarioModeloApellido: string;

  id?: string;
  tipo: 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL';
  fechaInicio: Date;
  fechaFin: Date;
  activa: boolean;
}
  