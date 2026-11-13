import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePhaseDto } from './create-phase.dto';

// Una fase no cambia de torneo: solo se actualizan nombre, tipo y orden
export class UpdatePhaseDto extends PartialType(OmitType(CreatePhaseDto, ['tournamentId'] as const)) {}
