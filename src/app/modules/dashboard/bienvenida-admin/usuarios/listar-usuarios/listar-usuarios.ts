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
      this.cdr.detectChanges();

      usuarios.forEach(u => {
        this.rolSeleccionado[u.uid] = u.rol;
      });
    });
  }

  cambiarRol(uid: string) {
    this.usuarioService.cambiarRol(uid, this.rolSeleccionado[uid]);
  }

  editarUsuario(uid: string) {
    this.router.navigate(['/admin/usuarios/editar', uid]);
  }

}
