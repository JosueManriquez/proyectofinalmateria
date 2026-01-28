import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { UsuarioService } from '../services/usuario';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { of } from 'rxjs';

export const adminGuard = () => {
  const router = inject(Router);
  const afAuth = inject(AngularFireAuth);
  const usuarioService = inject(UsuarioService);

  return afAuth.authState.pipe(
    take(1),
    switchMap(user => {
      if (!user) {
        return of(false); // No hay usuario, rechazado  asdsa
      }
      // Si hay usuario, buscamos su rol en Firestore
      return usuarioService.obtenerUsuario(user.uid).pipe(
        map(u => u?.rol === 'admin') // Devuelve true solo si es admin
      );
    }),
    tap(esAdmin => {
      if (!esAdmin) {
        console.log('⛔ Acceso denegado: No eres administrador');
        router.navigate(['/login']); // O a '/usuario' si prefieres
      }
    })
  );
};
