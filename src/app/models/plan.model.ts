export interface PlanModelo {
  id?: string;
  nombre: string;         // Ej: "Mensual Estudiante", "Anual VIP"
  precio: number;         // Ej: 180
  duracionDias: number;   // Ej: 30, 90, 365
  descripcion?: string;   // Ej: "Acceso de 08:00 a 14:00"
  imagenUrl?: string;     // URL de la imagen (puedes usar una por defecto si no hay)
  activo: boolean;        // Para ocultar planes viejos sin borrarlos
}