import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService } from '../../../../../services/usuario';
import { UsuarioModelo } from '../../../../../models/usuario.model';

@Component({
  selector: 'app-editar-usuario',
  templateUrl: './editar-usuario.html',
  styleUrls: ['./editar-usuario.css'],
  standalone: false
})
export class EditarUsuario implements OnInit {

  usuario: Partial<UsuarioModelo> = {};
  uid: string = '';

  constructor(
    private route: ActivatedRoute,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    /* this.uid = this.route.snapshot.paramMap.get('uid') || '';
    if (this.uid) {
      this.usuarioService.obtenerUsuario(this.uid).subscribe(u => {
        this.usuario = u;
      });
    } */
  }

  guardar() {
    if (!this.uid) return;

    this.usuarioService.cambiarRol(this.uid, this.usuario.rol!);
    alert('Usuario actualizado');
    this.router.navigate(['/admin/usuarios']);
  }

}
