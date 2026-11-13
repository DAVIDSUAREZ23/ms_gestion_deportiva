import { PickType } from '@nestjs/mapped-types';
import { CreateGroupDto } from './create-group.dto';

// Un grupo no cambia de fase: solo se actualiza su nombre
export class UpdateGroupDto extends PickType(CreateGroupDto, ['name'] as const) {}
