import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateMatchDto } from './create-match.dto';

// Un partido no cambia de fase; el resto se puede ajustar mientras esté programado
export class UpdateMatchDto extends PartialType(OmitType(CreateMatchDto, ['phaseId'] as const)) {}
