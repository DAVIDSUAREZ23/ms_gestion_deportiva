import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { SecurityGuard } from './common/guards/security.guard';
import { PlayerContractsModule } from './player-contracts/player-contracts.module';
import { PlayerProfilesModule } from './player-profiles/player-profiles.module';
import { PlayerSkillsModule } from './player-skills/player-skills.module';
import { PlayersModule } from './players/players.module';
import { SkillsModule } from './skills/skills.module';
import { SportsModule } from './sports/sports.module';
import { TeamSportsModule } from './team-sports/team-sports.module';
import { TeamsModule } from './teams/teams.module';
import { TicketsModule } from './tickets/tickets.module';
import { VenueSectionsModule } from './venue-sections/venue-sections.module';
import { FansModule } from './fans/fans.module';
import { GroupsModule } from './groups/groups.module';
import { MatchAnnotationsModule } from './match-annotations/match-annotations.module';
import { MatchesModule } from './matches/matches.module';
import { PhasesModule } from './phases/phases.module';
import { TournamentOverviewModule } from './tournament-overview/tournament-overview.module';
import { TournamentRegistrationsModule } from './tournament-registrations/tournament-registrations.module';
import { TournamentVenuesModule } from './tournament-venues/tournament-venues.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { VenuesModule } from './venues/venues.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
    }),
    SportsModule,
    TeamsModule,
    PlayersModule,
    SkillsModule,
    TeamSportsModule,
    PlayerContractsModule,
    PlayerSkillsModule,
    PlayerProfilesModule,
    // Módulo Gestión de Competencias (HU-GC-01 a HU-GC-08)
    VenuesModule,
    TournamentsModule,
    TournamentRegistrationsModule,
    TournamentVenuesModule,
    PhasesModule,
    GroupsModule,
    MatchesModule,
    MatchAnnotationsModule,
    TournamentOverviewModule,
    // Aficionados (Aficionado y Aficionado Equipo)
    FansModule,
    // Boletería (Localidad y Boleto)
    VenueSectionsModule,
    TicketsModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: SecurityGuard }],
})
export class AppModule {}
