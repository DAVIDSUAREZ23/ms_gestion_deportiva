import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateMatchAnnotationDto } from './create-match-annotation.dto';

// Una anotación no cambia de partido; se corrigen jugador, minuto y nota
export class UpdateMatchAnnotationDto extends PartialType(OmitType(CreateMatchAnnotationDto, ['matchId'] as const)) {}
