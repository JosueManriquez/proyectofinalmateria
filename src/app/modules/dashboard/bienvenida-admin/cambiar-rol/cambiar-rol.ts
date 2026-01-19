import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { UsuarioService } from '../../../../services/usuario';
import { UsuarioModelo } from '../../../../models/usuario.model';

@Component({
  selector: 'app-cambiar-rol',
  templateUrl: './cambiar-rol.html',
  styleUrl: './cambiar-rol.css',
  standalone: false,
})
export class CambiarRol implements OnInit {

  usuarios: UsuarioModelo[] = [];
  rolSeleccionado: { [uid: string]: string } = {};

  constructor(private usuarioService: UsuarioService, private cdr:ChangeDetectorRef) { }

  ngOnInit(): void {
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        console.log('Usuarios recibidos:', usuarios);
        this.usuarios = usuarios;
        this.cdr.detectChanges();

        usuarios.forEach(usuario => {
          if (usuario.uid) {
            this.rolSeleccionado[usuario.uid] = usuario.rol;
          }
        });
      },
      error: (err) => {
        console.error('Error Firestore:', err);
      }
    });
  }


  cambiarRol(uid: string): void {
    const rolNuevo = this.rolSeleccionado[uid];
    this.usuarioService.cambiarRol(uid, rolNuevo);
  }
}
