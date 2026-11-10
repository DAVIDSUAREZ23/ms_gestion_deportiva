import { Injectable } from '@nestjs/common';
import { CreateSkillDto } from '../dto/create-skill.dto';
import { SkillResponseDto, SkillSummaryDto } from '../dto/skill-response.dto';
import { UpdateSkillDto } from '../dto/update-skill.dto';
import { Skill } from '../entities/skill.entity';

@Injectable()
export class SkillMapper {
  toEntity(dto: CreateSkillDto): Skill {
    const skill = new Skill();
    skill.name = dto.name;
    skill.description = dto.description ?? null;
    return skill;
  }

  // Aplica solo los campos enviados en la actualización parcial
  mergeEntity(skill: Skill, dto: UpdateSkillDto): Skill {
    if (dto.name !== undefined) skill.name = dto.name;
    if (dto.description !== undefined) skill.description = dto.description;
    return skill;
  }

  toSummaryDto(skill: Skill): SkillSummaryDto {
    return { id: skill.id, name: skill.name, active: skill.active };
  }

  toResponseDto(skill: Skill): SkillResponseDto {
    return { ...this.toSummaryDto(skill), description: skill.description };
  }

  toResponseDtoList(skills: Skill[]): SkillResponseDto[] {
    return skills.map((skill) => this.toResponseDto(skill));
  }
}
