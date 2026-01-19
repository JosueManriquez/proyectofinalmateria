export interface SuscripcionModelo {
  id?: string;
  uidUsuario: string;
  tipo: 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL';
  fechaInicio: Date;
  fechaFin: Date;
  activa: boolean;
}
