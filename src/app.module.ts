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
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: SecurityGuard }],
})
export class AppModule {}
