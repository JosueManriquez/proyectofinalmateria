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

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [{ data: new Array(12).fill(0), label: 'Ganancias (Bs)', backgroundColor: '#4e73df' }]
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
    private injector: Injector // Inyectamos el Injector como en tu servicio funcional
  ) { }

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas() {
    runInInjectionContext(this.injector, () => {

      // 1. CARGAR SUSCRIPCIONES
      this.firestore.collection<SuscripcionModelo>('suscripciones').valueChanges().subscribe((subs) => {
        const ventasMes = new Array(12).fill(0);
        const hoy = new Date();
        let sumaMesActual = 0;

        // Contar membresías activas
        this.totalClientesActivos = subs.filter(s => s.activa === true).length;

        subs.forEach(s => {
          // Conversión flexible: intentamos Timestamp de Firebase primero, luego Date normal
          const fechaRaw: any = s.fechaInicio;
          let f: Date = fechaRaw?.seconds ? new Date(fechaRaw.seconds * 1000) : new Date(fechaRaw);

          if (!isNaN(f.getTime())) {
            const mesIndex = f.getMonth(); // 0 = Enero, 1 = Febrero...
            const monto = Number(s.precioPagado || 0);

            // Llenamos el gráfico (Mostramos todos los datos que existan en la DB)
            ventasMes[mesIndex] += monto;

            // Solo sumamos a la tarjeta si es el mes y año en el que estamos (Feb 2026)
            if (mesIndex === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()) {
              sumaMesActual += monto;
            }
          }
        });

        this.ingresosDelMes = sumaMesActual;
        // IMPORTANTE: Creamos una nueva referencia para que Chart.js detecte el cambio
        this.barChartData.datasets[0].data = [...ventasMes];
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
    const doc = new jsPDF();
    const hoy = new Date();
    const fechaReporte = hoy.toLocaleDateString('es-BO');
    const horaReporte = hoy.toLocaleTimeString('es-BO');

    // 1. ENCABEZADO ESTILO CORPORATIVO
    doc.setFillColor(33, 37, 41); // Gris muy oscuro/Negro
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('GYMSYSTEM - REPORTE DE GESTIÓN', 14, 20);

    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${fechaReporte} | Hora: ${horaReporte}`, 14, 30);
    doc.text(`Responsable: Josue Manriquez Lopez`, 14, 35);

    // 2. RESUMEN FINANCIERO (DIARIO Y MENSUAL)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('1. Resumen Económico', 14, 55);

    // Calculamos la ganancia de hoy filtrando los datos actuales
    const gananciasHoy = this.calcularGananciasHoy();

    autoTable(doc, {
      startY: 60,
      head: [['Descripción del Ingreso', 'Monto Acumulado']],
      body: [
        ['Ganancias Totales del Día (Cierre de Caja)', `${gananciasHoy} Bs`],
        ['Ganancias Totales del Mes (Febrero 2026)', `${this.ingresosDelMes} Bs`],
/*         ['Promedio de Ingreso por Socio', `${(this.ingresosDelMes / (this.totalClientesActivos || 1)).toFixed(2)} Bs`]
 */      ],
      theme: 'grid',
      headStyles: { fillColor: [78, 115, 223] } // Azul Primary
    });

    // 3. ESTADO OPERATIVO (MEMBRESÍAS Y AFLUENCIA)
    doc.setFontSize(16);
    doc.text('2. Análisis Operativo', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Indicador de Gestión', 'Valor Actual']],
      body: [
        ['Membresías con Estado Activo', this.totalClientesActivos.toString()],
        ['Asistencias Registradas (Hoy)', this.totalAsistenciasHoy.toString()],
        /* ['Capacidad Utilizada (Estimada)', `${((this.totalAsistenciasHoy / 100) * 100).toFixed(1)}%`] */
      ],
      theme: 'striped',
      headStyles: { fillColor: [28, 200, 138] } // Verde Success
    });

    // 4. DESGLOSE MENSUAL HISTÓRICO
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
      headStyles: { fillColor: [133, 135, 150] } // Gris
    });

    // PIE DE PÁGINA
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10);
      doc.text('SISTEMA GENERADO PARA DEFENSA DE PROYECTO - UNANDES', 100, doc.internal.pageSize.height - 10);
    }

    doc.save(`Reporte_GymSystem_${fechaReporte.replace(/\//g, '-')}.pdf`);
  }

  // Función auxiliar para calcular lo del día
  private calcularGananciasHoy(): number {
    const hoy = new Date().toDateString();
    let suma = 0;
    // Aquí usamos la variable que ya tienes en el subscribe de suscripciones
    // Si no tienes acceso a la lista completa, podrías guardarla en una variable global 'listaSuscripciones'
    return suma; // Implementar lógica de suma según tus datos locales
  }

}