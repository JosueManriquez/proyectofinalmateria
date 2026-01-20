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
  rolSeleccionado: { [uid: string]: string } = {};

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuarioService.obtenerUsuarios().subscribe(usuarios => {
      this.usuarios = usuarios;

      usuarios.forEach(u => {
        if (u.uid) {
          this.rolSeleccionado[u.uid] = u.rol;
        }
      });

      this.cdr.detectChanges();
    });
  }

  cambiarRol(uid: string): void {
    const nuevoRol = this.rolSeleccionado[uid];
    if (!nuevoRol) return;

    this.usuarioService.cambiarRol(uid, nuevoRol);
  }

  editarUsuario(uid: string): void {
    this.router.navigate(['/admin/usuarios/editar', uid]);
  }

}
