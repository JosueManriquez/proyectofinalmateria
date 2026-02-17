import { Component, OnInit, ChangeDetectorRef, Injector, runInInjectionContext } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth'; // 1. Importar Auth
import { SuscripcionModelo } from '../../../models/suscripcion';
import { AsistenciaModelo } from '../../../models/asistencia';
import { UsuarioModelo } from '../../../models/usuario.model'; // 2. Importar Modelo Usuario
import { PdfReportService } from '../../../services/pdf-report';

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
  listaSuscripciones: SuscripcionModelo[] = [];

  // Aquí guardaremos el nombre real (ej: "Josue Manriquez")
  usuarioLogueado: string = 'Cargando...';

  public barChartOptions: ChartConfiguration['options'] = { responsive: true, maintainAspectRatio: false };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [{ data: new Array(12).fill(0), label: 'Flujo de Caja (Bs)', backgroundColor: '#4e73df' }]
  };

  public lineChartOptions: ChartConfiguration['options'] = { responsive: true, maintainAspectRatio: false };
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartData<'line'> = {
    labels: ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
    datasets: [{ data: new Array(6).fill(0), label: 'Asistencias', borderColor: '#1cc88a', fill: true, tension: 0.4 }]
  };

  constructor(
    private firestore: AngularFirestore,
    private cdr: ChangeDetectorRef,
    private injector: Injector,
    private pdfService: PdfReportService,
    private afAuth: AngularFireAuth // Inyectamos Auth
  ) { }

  ngOnInit(): void {
    // Escuchar el estado de autenticación
    this.afAuth.authState.subscribe(user => {
      // 1. Verificamos si hay usuario
      if (user && user.email) {

        // Asignamos el email INMEDIATAMENTE como respaldo (para que no diga "Cargando...")
        this.usuarioLogueado = user.email;

        // --- CORRECCIÓN DEL ERROR NG0203 ---
        // Envolvemos la llamada a Firestore para recuperar el contexto de inyección
        runInInjectionContext(this.injector, () => {

          this.firestore.collection<UsuarioModelo>('usuarios', ref =>
            ref.where('email', '==', user.email).limit(1)
          ).valueChanges().subscribe({
            next: (usuariosEncontrados) => {
              if (usuariosEncontrados.length > 0) {
                const u = usuariosEncontrados[0];
                // Si encontramos nombre y apellido, actualizamos la variable
                if (u.nombre && u.apellido) {
                  this.usuarioLogueado = `${u.nombre} ${u.apellido}`;
                }
              }
            },
            error: (error) => {
              console.error('Error buscando usuario:', error);
            }
          });

        });
        // -----------------------------------

      } else {
        this.usuarioLogueado = 'Usuario Desconocido';
      }
    });

    this.cargarEstadisticas();
  }

  exportarPDF() {
    const datosGrafico = this.barChartData.datasets[0].data as number[];

    this.pdfService.generarPDF(
      this.ingresosDelMes,
      this.totalClientesActivos,
      this.totalAsistenciasHoy,
      this.listaSuscripciones,
      datosGrafico,
      this.usuarioLogueado // Pasamos el nombre real obtenido
    );
  }

  cargarEstadisticas() {
    runInInjectionContext(this.injector, () => {
      // 1. SUSCRIPCIONES
      this.firestore.collection<SuscripcionModelo>('suscripciones').valueChanges().subscribe((subs) => {
        this.listaSuscripciones = subs;
        const flujoCajaAnual = new Array(12).fill(0);
        const hoy = new Date();
        let cajaMesActual = 0;

        this.totalClientesActivos = subs.filter(s => s.activa === true).length;

        subs.forEach(s => {
          const fechaRef: any = s.fechaPago || s.fechaInicio;
          const f = fechaRef?.seconds ? new Date(fechaRef.seconds * 1000) : new Date(fechaRef);

          if (f && !isNaN(f.getTime())) {
            const mes = f.getMonth();
            const anio = f.getFullYear();
            const monto = Number(s.precioPagado || 0);

            if (anio === hoy.getFullYear()) flujoCajaAnual[mes] += monto;
            if (mes === hoy.getMonth() && anio === hoy.getFullYear()) cajaMesActual += monto;
          }
        });

        this.ingresosDelMes = cajaMesActual;
        this.barChartData.datasets[0].data = [...flujoCajaAnual];
        this.barChartData = { ...this.barChartData };
        this.cdr.detectChanges();
      });

      // 2. ASISTENCIAS
      this.firestore.collection<AsistenciaModelo>('asistencias').valueChanges().subscribe((asist) => {
        const datosAfluencia = new Array(6).fill(0);
        const hoyString = new Date().toDateString();
        let contadorHoy = 0;

        asist.forEach(a => {
          const fechaRaw: any = a.fecha;
          const f = fechaRaw?.seconds ? new Date(fechaRaw.seconds * 1000) : new Date(fechaRaw);

          if (!isNaN(f.getTime())) {
            if (f.toDateString() === hoyString) contadorHoy++;

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
}