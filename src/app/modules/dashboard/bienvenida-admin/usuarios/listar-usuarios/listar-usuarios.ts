// src/app/modules/dashboard/bienvenida-admin/usuarios/listar-usuarios/listar-usuarios.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UsuarioService } from '../../../../../services/usuario';
import { UsuarioModelo } from '../../../../../models/usuario.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listar-usuarios',
  templateUrl: './listar-usuarios.html',
  styleUrls: ['./listar-usuarios.css'],
  standalone: false
})
export class ListarUsuarios implements OnInit {

  usuarios: UsuarioModelo[] = [];
  usuariosFiltrados: UsuarioModelo[] = []; // IMPORTANTE
  rolSeleccionado: { [uid: string]: string } = {};
  
  textoBusqueda: string = '';
  cargando: boolean = true;

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.cargando = true;
    this.usuarioService.obtenerUsuarios().subscribe(data => {
      
      // FILTRO: Solo usuarios que tengan nombre y UID válido (elimina filas vacías)
      const listaLimpia = data.filter(u => u.uid && u.nombre);

      this.usuarios = listaLimpia;
      this.usuariosFiltrados = listaLimpia; 

      // Mapear roles
      listaLimpia.forEach(u => {
        if (u.uid) {
          this.rolSeleccionado[u.uid] = u.rol || 'cliente';
        }
      });

      this.cargando = false;
      this.cdr.detectChanges(); // Obligar a Angular a pintar los cambios
    });
  }

  filtrar(): void {
    const texto = this.textoBusqueda.toLowerCase();
    if (!texto) {
      this.usuariosFiltrados = this.usuarios;
    } else {
      this.usuariosFiltrados = this.usuarios.filter(u => 
        (u.nombre && u.nombre.toLowerCase().includes(texto)) ||
        (u.apellido && u.apellido.toLowerCase().includes(texto)) ||
        (u.ci && u.ci.includes(texto)) ||
        (u.email && u.email.toLowerCase().includes(texto))
      );
    }
  }

  cambiarRol(uid: string): void {
    const nuevoRol = this.rolSeleccionado[uid];
    if (confirm(`¿Cambiar rol a "${nuevoRol}"?`)) {
      this.usuarioService.cambiarRol(uid, nuevoRol);
    }
  }

  toggleEstado(u: UsuarioModelo): void {
    if (!u.uid) return;
    const nuevoEstado = !u.activo;
    if(confirm(`¿Deseas ${nuevoEstado ? 'activar' : 'desactivar'} a este usuario?`)) {
      this.usuarioService.desactivarUsuario(u.uid, nuevoEstado);
    } else {
      u.activo = !u.activo; // Revertir visualmente si cancela
      this.cdr.detectChanges();
    }
  }

  editarUsuario(uid: string): void {
    // Asegúrate de que esta ruta coincida con tu archivo de rutas
    this.router.navigate(['/admin/usuarios/editar', uid]);
  }
}