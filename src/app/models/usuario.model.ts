export interface UsuarioModelo{
    uid: string;
    email: string;
    rol: 'admin' | 'usuario' | 'cliente';
    activo: boolean;
}