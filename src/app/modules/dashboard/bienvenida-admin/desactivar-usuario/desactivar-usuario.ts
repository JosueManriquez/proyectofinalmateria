import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../../../services/usuario';
import { UsuarioModelo } from '../../../../models/usuario.model';
import { disableDebugTools } from '@angular/platform-browser';

@Component({
  selector: 'app-desactivar-usuario',
  templateUrl: './desactivar-usuario.html',
  styleUrls: ['./desactivar-usuario.css'],
  standalone: false,
})
export class DesactivarUsuario implements OnInit {

  usuarios: UsuarioModelo[] = [];

  constructor(private usuarioService: UsuarioService, private cdr:ChangeDetectorRef) {}

  ngOnInit(): void {
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err),
    });
  }

  cambiarEstado(usuario: UsuarioModelo): void {
    debugger;
    if (!usuario.uid) return;

    const nuevoEstado = !usuario.activo;

    this.usuarioService
      .desactivarUsuario(usuario.uid, nuevoEstado)
      .then(() => {
        usuario.activo = nuevoEstado;
      });
  }
}
