import { Injectable } from '@angular/core';
import { SuscripcionModelo } from '../models/suscripcion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PdfReportService {

  constructor() { }

  generarPDF(
    ingresosMes: number,
    totalClientesActivos: number,
    totalAsistenciasHoy: number,
    listaSuscripciones: SuscripcionModelo[],
    datosGraficoAnual: number[],
    nombreResponsable: string // Recibimos el nombre aquí
  ) {
    // 1. Configuración TAMAÑO CARTA
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const hoy = new Date();
    const fechaReporte = hoy.toLocaleDateString('es-BO');
    const horaReporte = hoy.toLocaleTimeString('es-BO');

    // 2. ENCABEZADO
    doc.setFillColor(33, 37, 41);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('GYMSYSTEM - REPORTE DE GESTIÓN', 14, 20);

    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${fechaReporte} | Hora: ${horaReporte}`, 14, 30);
    doc.text(`Responsable: ${nombreResponsable}`, 14, 35); // Usamos la variable

    // 3. RESUMEN FINANCIERO (Cierre de Caja Detallado)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('1. Cierre de Caja (Desglose de Ingresos)', 14, 55);

    // Calculamos el desglose usando la función auxiliar
    const desglose = this.calcularDesgloseHoy(listaSuscripciones);

    autoTable(doc, {
      startY: 60,
      head: [['Concepto / Método de Pago', 'Monto']],
      body: [
        ['Ingresos en EFECTIVO', `${desglose.efectivo} Bs`],
        ['Ingresos por QR (Banco)', `${desglose.qr} Bs`],
        // Fila de Total
        ['TOTAL RECAUDADO HOY', `${desglose.total} Bs`],
        ['Acumulado del Mes', `${ingresosMes} Bs`] // Dato informativo
      ],
      theme: 'grid',
      headStyles: { fillColor: [78, 115, 223] },
      // Pintamos la fila del TOTAL de un color suave para resaltar
      willDrawCell: (data) => {
        if (data.row.index === 2 && data.section === 'body') {
          doc.setFillColor(240, 240, 240);
        }
      }
    });

    // 4. ESTADO OPERATIVO
    doc.setFontSize(16);
    doc.text('2. Análisis Operativo', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Indicador de Gestión', 'Valor Actual']],
      body: [
        ['Membresías con Estado Activo', totalClientesActivos.toString()],
        ['Asistencias Registradas (Hoy)', totalAsistenciasHoy.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [28, 200, 138] }
    });

    // 5. GRÁFICO ANUAL (Tabla)
    doc.setFontSize(16);
    doc.text('3. Evolución de Ingresos Anual', 14, (doc as any).lastAutoTable.finalY + 15);

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const tablaCuerpo = meses.map((mes, i) => [mes, `${datosGraficoAnual[i] || 0} Bs`]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Mes', 'Monto']],
      body: tablaCuerpo,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [133, 135, 150] }
    });

    // 6. DETALLE DE VENTAS (Salto de página forzado)
    doc.addPage();

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('4. Detalle de Transacciones (Hoy)', 14, 20);

    const ventasDetalle = this.obtenerVentasDeHoy(listaSuscripciones);
    // Mapeamos los datos para la tabla, incluyendo la nueva columna de Método
    const cuerpoVentas = ventasDetalle.map(v => [
      v.UsuarioModeloApellido || 'S/N',
      v.tipo,
      v.metodoPago || 'EFECTIVO', // Mostramos el método (o Efectivo por defecto)
      `${v.precioPagado} Bs`
    ]);

    if (cuerpoVentas.length > 0) {
      autoTable(doc, {
        startY: 30,
        head: [['Socio', 'Plan', 'Método', 'Monto']],
        body: cuerpoVentas,
        theme: 'plain'
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('No se registraron transacciones monetarias hoy.', 14, 30);
    }

    // PIE DE PÁGINA
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10);
      doc.text('SISTEMA GENERADO PARA DEFENSA DE PROYECTO - UNANDES', 60, doc.internal.pageSize.height - 10);
    }

    doc.save(`Reporte_GymSystem_${fechaReporte.replace(/\//g, '-')}.pdf`);
  }

  // --- Helpers Privados ---

  // Calcula cuánto fue Efectivo y cuánto QR solo del día de hoy
  private calcularDesgloseHoy(lista: SuscripcionModelo[]) {
    const hoyString = new Date().toDateString();
    let efectivo = 0;
    let qr = 0;

    lista.forEach(s => {
      const fechaRef: any = s.fechaPago || s.fechaInicio;
      const f = fechaRef?.seconds ? new Date(fechaRef.seconds * 1000) : new Date(fechaRef);

      if (f.toDateString() === hoyString) {
        const monto = Number(s.precioPagado || 0);
        // Si dice 'QR' sumamos a QR, si no (o si es null) asumimos EFECTIVO
        if (s.metodoPago === 'QR') {
          qr += monto;
        } else {
          efectivo += monto;
        }
      }
    });

    return { efectivo, qr, total: efectivo + qr };
  }

  // Filtra la lista para obtener solo las ventas de hoy
  private obtenerVentasDeHoy(lista: SuscripcionModelo[]): SuscripcionModelo[] {
    const hoyString = new Date().toDateString();
    return lista.filter(s => {
      const fechaRef: any = s.fechaPago || s.fechaInicio;
      const f = fechaRef?.seconds ? new Date(fechaRef.seconds * 1000) : new Date(fechaRef);
      return f.toDateString() === hoyString;
    });
  }

}