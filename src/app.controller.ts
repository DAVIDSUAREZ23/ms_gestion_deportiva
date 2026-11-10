import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  // Verificación de salud: pública para que los monitores no necesiten JWT
  @Public()
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
