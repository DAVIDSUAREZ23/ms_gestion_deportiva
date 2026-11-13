import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateVenueSectionDto } from './create-venue-section.dto';

// Una localidad no cambia de escenario
export class UpdateVenueSectionDto extends PartialType(OmitType(CreateVenueSectionDto, ['venueId'] as const)) {}
