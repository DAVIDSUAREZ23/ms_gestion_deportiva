import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitionGroup } from '../groups/entities/competition-group.entity';
import { Match } from '../matches/entities/match.entity';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { Phase } from './entities/phase.entity';
import { PhaseMapper } from './mappers/phase.mapper';
import { PhasesController } from './phases.controller';
import { PhasesService } from './phases.service';

@Module({
  imports: [TypeOrmModule.forFeature([Phase, CompetitionGroup, Match]), TournamentsModule],
  controllers: [PhasesController],
  providers: [PhasesService, PhaseMapper],
  exports: [PhasesService, PhaseMapper],
})
export class PhasesModule {}
