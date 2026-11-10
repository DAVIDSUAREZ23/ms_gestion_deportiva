import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerSkill } from '../player-skills/entities/player-skill.entity';
import { Skill } from './entities/skill.entity';
import { SkillMapper } from './mappers/skill.mapper';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';

@Module({
  imports: [TypeOrmModule.forFeature([Skill, PlayerSkill])],
  controllers: [SkillsController],
  providers: [SkillsService, SkillMapper],
  exports: [SkillsService, SkillMapper],
})
export class SkillsModule {}
