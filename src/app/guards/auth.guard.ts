import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { map, take, tap } from 'rxjs/operators';

export const authGuard = () => {
  const router = inject(Router);
  const afAuth = inject(AngularFireAuth);

  return afAuth.authState.pipe(
    take(1), // Toma solo el primer valor y cierra la suscripción
    map(user => !!user), // Convierte el objeto user a true o false
    tap(isLoggedIn => {
      if (!isLoggedIn) {
        console.log('⛔ Acceso denegado: Debes iniciar sesión');
        router.navigate(['/login']);
      }
    })
  );
};