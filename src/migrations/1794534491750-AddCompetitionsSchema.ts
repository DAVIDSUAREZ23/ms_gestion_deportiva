import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompetitionsSchema1794534491750 implements MigrationInterface {
    name = 'AddCompetitionsSchema1794534491750'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`match_annotations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`minute\` int NOT NULL, \`notes\` varchar(255) NULL, \`match_id\` int NOT NULL, \`player_id\` int NOT NULL, \`team_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`venues\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(120) NOT NULL, \`city\` varchar(100) NULL, \`capacity\` int NULL, \`active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_bb28c67fad9c46fac68d84a8ae\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`matches\` (\`id\` int NOT NULL AUTO_INCREMENT, \`scheduled_at\` datetime NOT NULL, \`status\` enum ('SCHEDULED', 'FINISHED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED', \`home_score\` int NULL, \`away_score\` int NULL, \`bracket_position\` int NULL, \`phase_id\` int NOT NULL, \`group_id\` int NULL, \`home_team_id\` int NOT NULL, \`away_team_id\` int NOT NULL, \`venue_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tournament_registrations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`registered_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`tournament_id\` int NOT NULL, \`team_id\` int NOT NULL, UNIQUE INDEX \`uk_tournament_team\` (\`tournament_id\`, \`team_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tournaments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(120) NOT NULL, \`description\` varchar(255) NULL, \`registration_deadline\` date NOT NULL, \`start_date\` date NOT NULL, \`end_date\` date NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`sport_id\` int NOT NULL, UNIQUE INDEX \`IDX_b63b048f5871d7f48cdb4d4de1\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`phases\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(80) NOT NULL, \`type\` enum ('GROUP_STAGE', 'KNOCKOUT') NOT NULL, \`phase_order\` int NOT NULL, \`tournament_id\` int NOT NULL, UNIQUE INDEX \`uk_phase_order\` (\`tournament_id\`, \`phase_order\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`group_teams\` (\`id\` int NOT NULL AUTO_INCREMENT, \`group_id\` int NOT NULL, \`team_id\` int NOT NULL, UNIQUE INDEX \`uk_group_team\` (\`group_id\`, \`team_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`competition_groups\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, \`phase_id\` int NOT NULL, UNIQUE INDEX \`uk_group_name\` (\`phase_id\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`match_annotations\` ADD CONSTRAINT \`FK_a92dad25282c196c8f500057ab6\` FOREIGN KEY (\`match_id\`) REFERENCES \`matches\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match_annotations\` ADD CONSTRAINT \`FK_65d1bab95cc6538f59f3c724ee5\` FOREIGN KEY (\`player_id\`) REFERENCES \`players\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match_annotations\` ADD CONSTRAINT \`FK_9914bc236446432a507c3614604\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matches\` ADD CONSTRAINT \`FK_4445c1b2bd39fe81088ea640acb\` FOREIGN KEY (\`phase_id\`) REFERENCES \`phases\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matches\` ADD CONSTRAINT \`FK_24e8071e3486275a5a31912a87d\` FOREIGN KEY (\`group_id\`) REFERENCES \`competition_groups\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matches\` ADD CONSTRAINT \`FK_bb25f11ea6fa78b344a68923769\` FOREIGN KEY (\`home_team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matches\` ADD CONSTRAINT \`FK_e457f057d971e464c1ebf6378c5\` FOREIGN KEY (\`away_team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matches\` ADD CONSTRAINT \`FK_cb90abceb14ab1b73e92823acce\` FOREIGN KEY (\`venue_id\`) REFERENCES \`venues\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_registrations\` ADD CONSTRAINT \`FK_a422cd63ff5891961bc7c996aa2\` FOREIGN KEY (\`tournament_id\`) REFERENCES \`tournaments\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_registrations\` ADD CONSTRAINT \`FK_d6d6bf5d630deeea85ac984dffa\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournaments\` ADD CONSTRAINT \`FK_186453945127b1b37ff7c22984d\` FOREIGN KEY (\`sport_id\`) REFERENCES \`sports\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`phases\` ADD CONSTRAINT \`FK_38239acd04502fb5f883d2956a2\` FOREIGN KEY (\`tournament_id\`) REFERENCES \`tournaments\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_teams\` ADD CONSTRAINT \`FK_6e9057760268c61106d216deae0\` FOREIGN KEY (\`group_id\`) REFERENCES \`competition_groups\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_teams\` ADD CONSTRAINT \`FK_578cb7280cd7810fa10041d1ea8\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`competition_groups\` ADD CONSTRAINT \`FK_f47ce67de43dc904be5c8addeea\` FOREIGN KEY (\`phase_id\`) REFERENCES \`phases\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`competition_groups\` DROP FOREIGN KEY \`FK_f47ce67de43dc904be5c8addeea\``);
        await queryRunner.query(`ALTER TABLE \`group_teams\` DROP FOREIGN KEY \`FK_578cb7280cd7810fa10041d1ea8\``);
        await queryRunner.query(`ALTER TABLE \`group_teams\` DROP FOREIGN KEY \`FK_6e9057760268c61106d216deae0\``);
        await queryRunner.query(`ALTER TABLE \`phases\` DROP FOREIGN KEY \`FK_38239acd04502fb5f883d2956a2\``);
        await queryRunner.query(`ALTER TABLE \`tournaments\` DROP FOREIGN KEY \`FK_186453945127b1b37ff7c22984d\``);
        await queryRunner.query(`ALTER TABLE \`tournament_registrations\` DROP FOREIGN KEY \`FK_d6d6bf5d630deeea85ac984dffa\``);
        await queryRunner.query(`ALTER TABLE \`tournament_registrations\` DROP FOREIGN KEY \`FK_a422cd63ff5891961bc7c996aa2\``);
        await queryRunner.query(`ALTER TABLE \`matches\` DROP FOREIGN KEY \`FK_cb90abceb14ab1b73e92823acce\``);
        await queryRunner.query(`ALTER TABLE \`matches\` DROP FOREIGN KEY \`FK_e457f057d971e464c1ebf6378c5\``);
        await queryRunner.query(`ALTER TABLE \`matches\` DROP FOREIGN KEY \`FK_bb25f11ea6fa78b344a68923769\``);
        await queryRunner.query(`ALTER TABLE \`matches\` DROP FOREIGN KEY \`FK_24e8071e3486275a5a31912a87d\``);
        await queryRunner.query(`ALTER TABLE \`matches\` DROP FOREIGN KEY \`FK_4445c1b2bd39fe81088ea640acb\``);
        await queryRunner.query(`ALTER TABLE \`match_annotations\` DROP FOREIGN KEY \`FK_9914bc236446432a507c3614604\``);
        await queryRunner.query(`ALTER TABLE \`match_annotations\` DROP FOREIGN KEY \`FK_65d1bab95cc6538f59f3c724ee5\``);
        await queryRunner.query(`ALTER TABLE \`match_annotations\` DROP FOREIGN KEY \`FK_a92dad25282c196c8f500057ab6\``);
        await queryRunner.query(`DROP INDEX \`uk_group_name\` ON \`competition_groups\``);
        await queryRunner.query(`DROP TABLE \`competition_groups\``);
        await queryRunner.query(`DROP INDEX \`uk_group_team\` ON \`group_teams\``);
        await queryRunner.query(`DROP TABLE \`group_teams\``);
        await queryRunner.query(`DROP INDEX \`uk_phase_order\` ON \`phases\``);
        await queryRunner.query(`DROP TABLE \`phases\``);
        await queryRunner.query(`DROP INDEX \`IDX_b63b048f5871d7f48cdb4d4de1\` ON \`tournaments\``);
        await queryRunner.query(`DROP TABLE \`tournaments\``);
        await queryRunner.query(`DROP INDEX \`uk_tournament_team\` ON \`tournament_registrations\``);
        await queryRunner.query(`DROP TABLE \`tournament_registrations\``);
        await queryRunner.query(`DROP TABLE \`matches\``);
        await queryRunner.query(`DROP INDEX \`IDX_bb28c67fad9c46fac68d84a8ae\` ON \`venues\``);
        await queryRunner.query(`DROP TABLE \`venues\``);
        await queryRunner.query(`DROP TABLE \`match_annotations\``);
    }

}
