import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Marca una ruta o controlador como público: el SecurityGuard no consulta al ms de seguridad
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
