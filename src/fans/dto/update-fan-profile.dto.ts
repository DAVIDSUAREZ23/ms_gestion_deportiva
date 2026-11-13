import { PartialType } from '@nestjs/mapped-types';
import { CreateFanProfileDto } from './create-fan-profile.dto';

export class UpdateFanProfileDto extends PartialType(CreateFanProfileDto) {}
