import { Component, OnInit, ChangeDetectorRef, Injector, runInInjectionContext } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { SuscripcionModelo } from '../../../models/suscripcion';
import { AsistenciaModelo } from '../../../models/asistencia';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-reportes',
  standalone: false,
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css']
})
export class Reportes implements OnInit {

  ingresosDelMes: number = 0;
  totalClientesActivos: number = 0;
  totalAsistenciasHoy: number = 0;

  // Variable para almacenar los datos crudos y usarlos en el PDF
  listaSuscripciones: SuscripcionModelo[] = [];

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [{ data: new Array(12).fill(0), label: 'Flujo de Caja (Bs)', backgroundColor: '#4e73df' }]
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartData<'line'> = {
    labels: ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
    datasets: [{ data: new Array(6).fill(0), label: 'Asistencias', borderColor: '#1cc88a', fill: true, tension: 0.4 }]
  };

  constructor(
    private firestore: AngularFirestore,
    private cdr: ChangeDetectorRef,
    private injector: Injector
  ) { }

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas() {
    runInInjectionContext(this.injector, () => {

      // 1. CARGAR SUSCRIPCIONES (Cálculo Financiero por fechaPago)
      this.firestore.collection<SuscripcionModelo>('suscripciones').valueChanges().subscribe((subs) => {
        this.listaSuscripciones = subs; // Guardamos para el PDF

        const flujoCajaAnual = new Array(12).fill(0);
        const hoy = new Date();
        let cajaMesActual = 0;

        // Contar membresías activas
        this.totalClientesActivos = subs.filter(s => s.activa === true).length;

        subs.forEach(s => {
          // Usamos fechaPago si existe (nuevo estándar), si no, fechaInicio (retrocompatibilidad)
          const fechaRef: any = s.fechaPago || s.fechaInicio;
          const f = fechaRef?.seconds ? new Date(fechaRef.seconds * 1000) : new Date(fechaRef);

          if (f && !isNaN(f.getTime())) {
            const mes = f.getMonth(); // 0 = Enero
            const anio = f.getFullYear();
            const monto = Number(s.precioPagado || 0);

            // Llenamos el gráfico del AÑO ACTUAL (Flujo de Caja)
            if (anio === hoy.getFullYear()) {
              flujoCajaAnual[mes] += monto;
            }

            // Llenamos la tarjeta del MES ACTUAL
            if (mes === hoy.getMonth() && anio === hoy.getFullYear()) {
              cajaMesActual += monto;
            }
          }
        });

        this.ingresosDelMes = cajaMesActual;
        this.barChartData.datasets[0].data = [...flujoCajaAnual];
        this.barChartData = { ...this.barChartData };

        this.cdr.detectChanges();
      });

      // 2. CARGAR ASISTENCIAS
      this.firestore.collection<AsistenciaModelo>('asistencias').valueChanges().subscribe((asist) => {
        const datosAfluencia = new Array(6).fill(0);
        const hoyString = new Date().toDateString();
        let contadorHoy = 0;

        asist.forEach(a => {
          const fechaRaw: any = a.fecha;
          const f = fechaRaw?.seconds ? new Date(fechaRaw.seconds * 1000) : new Date(fechaRaw);

          if (!isNaN(f.getTime())) {
            // Contador de hoy (Tarjeta verde)
            if (f.toDateString() === hoyString) {
              contadorHoy++;
            }

            // Gráfico de horas (06:00 a 21:00)
            const h = f.getHours();
            if (h >= 6 && h < 9) datosAfluencia[0]++;
            else if (h >= 9 && h < 12) datosAfluencia[1]++;
            else if (h >= 12 && h < 15) datosAfluencia[2]++;
            else if (h >= 15 && h < 18) datosAfluencia[3]++;
            else if (h >= 18 && h < 21) datosAfluencia[4]++;
            else if (h >= 21) datosAfluencia[5]++;
          }
        });

        this.totalAsistenciasHoy = contadorHoy;
        this.lineChartData.datasets[0].data = [...datosAfluencia];
        this.lineChartData = { ...this.lineChartData };

        this.cdr.detectChanges();
      });
    });
  }

  generarPDF() {
    // 1. Configuración para TAMAÑO CARTA (Letter)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter' // Carta: 215.9mm x 279.4mm
    });

    const hoy = new Date();
    const fechaReporte = hoy.toLocaleDateString('es-BO');
    const horaReporte = hoy.toLocaleTimeString('es-BO');

    // 2. ENCABEZADO
    doc.setFillColor(33, 37, 41); // Color oscuro
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('GYMSYSTEM - REPORTE DE GESTIÓN', 14, 20);

    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${fechaReporte} | Hora: ${horaReporte}`, 14, 30);
    doc.text(`Responsable: Josue Manriquez Lopez`, 14, 35);

    // 3. RESUMEN FINANCIERO
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('1. Resumen Económico', 14, 55);

    const gananciasHoy = this.calcularGananciasHoy();

    autoTable(doc, {
      startY: 60,
      head: [['Descripción del Ingreso', 'Monto Acumulado']],
      body: [
        ['Ganancias Totales del Día (Cierre de Caja)', `${gananciasHoy} Bs`],
        ['Ganancias Totales del Mes (Acumulado)', `${this.ingresosDelMes} Bs`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [78, 115, 223] }
    });

    // 4. ESTADO OPERATIVO
    doc.setFontSize(16);
    doc.text('2. Análisis Operativo', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Indicador de Gestión', 'Valor Actual']],
      body: [
        ['Membresías con Estado Activo', this.totalClientesActivos.toString()],
        ['Asistencias Registradas (Hoy)', this.totalAsistenciasHoy.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [28, 200, 138] }
    });

    // 5. GRÁFICO ANUAL
    doc.setFontSize(16);
    doc.text('3. Evolución de Ingresos Anual', 14, (doc as any).lastAutoTable.finalY + 15);

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const datosGrafico = this.barChartData.datasets[0].data as number[];
    const tablaCuerpo = meses.map((mes, i) => [mes, `${datosGrafico[i] || 0} Bs`]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Mes', 'Monto']],
      body: tablaCuerpo,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [133, 135, 150] }
    });

    // 6. DETALLE DE VENTAS (AQUÍ ESTÁ LA MAGIA DEL SALTO DE PÁGINA)
    doc.addPage(); // <--- ESTO CREA LA NUEVA HOJA (Página 2)

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    // Fijamos la posición Y en 20 para que empiece arriba en la nueva hoja
    doc.text('4. Detalle de Transacciones (Hoy)', 14, 20);

    const ventasDetalle = this.obtenerVentasDeHoy();
    const cuerpoVentas = ventasDetalle.map(v => [
      v.UsuarioModeloApellido || 'S/N',
      v.tipo,
      `${v.precioPagado} Bs`
    ]);

    if (cuerpoVentas.length > 0) {
      autoTable(doc, {
        startY: 30, // <--- Fijamos el inicio de la tabla
        head: [['Socio', 'Plan', 'Monto']],
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

  // --- FUNCIONES AUXILIARES ---

  private calcularGananciasHoy(): number {
    const hoyString = new Date().toDateString();
    return this.listaSuscripciones.reduce((acc, s) => {
      const fechaRef: any = s.fechaPago || s.fechaInicio;
      const f = fechaRef?.seconds ? new Date(fechaRef.seconds * 1000) : new Date(fechaRef);
      return (f.toDateString() === hoyString) ? acc + Number(s.precioPagado || 0) : acc;
    }, 0);
  }

  private obtenerVentasDeHoy(): SuscripcionModelo[] {
    const hoyString = new Date().toDateString();
    return this.listaSuscripciones.filter(s => {
      const fechaRef: any = s.fechaPago || s.fechaInicio;
      const f = fechaRef?.seconds ? new Date(fechaRef.seconds * 1000) : new Date(fechaRef);
      return f.toDateString() === hoyString;
    });
  }
}