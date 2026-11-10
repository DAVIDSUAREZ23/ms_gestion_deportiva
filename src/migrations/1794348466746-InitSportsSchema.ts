import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSportsSchema1794348466746 implements MigrationInterface {
    name = 'InitSportsSchema1794348466746'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`skills\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`description\` varchar(255) NULL, \`active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_81f05095507fd84aa2769b4a52\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`player_skills\` (\`id\` int NOT NULL AUTO_INCREMENT, \`player_id\` int NOT NULL, \`skill_id\` int NOT NULL, UNIQUE INDEX \`uk_player_skill\` (\`player_id\`, \`skill_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`players\` (\`id\` int NOT NULL AUTO_INCREMENT, \`document_number\` varchar(20) NOT NULL, \`first_name\` varchar(80) NOT NULL, \`last_name\` varchar(80) NOT NULL, \`birth_date\` date NOT NULL, \`position\` varchar(50) NULL, \`nationality\` varchar(60) NULL, \`email\` varchar(120) NULL, \`phone\` varchar(20) NULL, \`active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_9736c84fd2654d2dd894b8bb88\` (\`document_number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`sports\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`description\` varchar(255) NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`parent_id\` int NULL, UNIQUE INDEX \`IDX_838312bddf12c427e3f66657ff\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`team_sports\` (\`id\` int NOT NULL AUTO_INCREMENT, \`team_id\` int NOT NULL, \`sport_id\` int NOT NULL, UNIQUE INDEX \`uk_team_sport\` (\`team_id\`, \`sport_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`teams\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`city\` varchar(100) NULL, \`founded_at\` date NULL, \`description\` varchar(255) NULL, \`active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_48c0c32e6247a2de155baeaf98\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`player_contracts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`start_date\` date NOT NULL, \`end_date\` date NOT NULL, \`released_at\` datetime NULL, \`player_id\` int NOT NULL, \`team_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`player_skills\` ADD CONSTRAINT \`FK_1ec09bc2eca330ad10927d3ea37\` FOREIGN KEY (\`player_id\`) REFERENCES \`players\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`player_skills\` ADD CONSTRAINT \`FK_2646438b8d39b999ce786003e6d\` FOREIGN KEY (\`skill_id\`) REFERENCES \`skills\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`sports\` ADD CONSTRAINT \`FK_5bc9d25aca265351a40abe7a82b\` FOREIGN KEY (\`parent_id\`) REFERENCES \`sports\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`team_sports\` ADD CONSTRAINT \`FK_017e3e07d4b34d9994807bbe8be\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`team_sports\` ADD CONSTRAINT \`FK_58d0151a68fd3d72284a4165f3a\` FOREIGN KEY (\`sport_id\`) REFERENCES \`sports\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`player_contracts\` ADD CONSTRAINT \`FK_a6a92f80d5b8bee63bd0042c845\` FOREIGN KEY (\`player_id\`) REFERENCES \`players\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`player_contracts\` ADD CONSTRAINT \`FK_3a1be401ee7f250d6ba2dd02c48\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`player_contracts\` DROP FOREIGN KEY \`FK_3a1be401ee7f250d6ba2dd02c48\``);
        await queryRunner.query(`ALTER TABLE \`player_contracts\` DROP FOREIGN KEY \`FK_a6a92f80d5b8bee63bd0042c845\``);
        await queryRunner.query(`ALTER TABLE \`team_sports\` DROP FOREIGN KEY \`FK_58d0151a68fd3d72284a4165f3a\``);
        await queryRunner.query(`ALTER TABLE \`team_sports\` DROP FOREIGN KEY \`FK_017e3e07d4b34d9994807bbe8be\``);
        await queryRunner.query(`ALTER TABLE \`sports\` DROP FOREIGN KEY \`FK_5bc9d25aca265351a40abe7a82b\``);
        await queryRunner.query(`ALTER TABLE \`player_skills\` DROP FOREIGN KEY \`FK_2646438b8d39b999ce786003e6d\``);
        await queryRunner.query(`ALTER TABLE \`player_skills\` DROP FOREIGN KEY \`FK_1ec09bc2eca330ad10927d3ea37\``);
        await queryRunner.query(`DROP TABLE \`player_contracts\``);
        await queryRunner.query(`DROP INDEX \`IDX_48c0c32e6247a2de155baeaf98\` ON \`teams\``);
        await queryRunner.query(`DROP TABLE \`teams\``);
        await queryRunner.query(`DROP INDEX \`uk_team_sport\` ON \`team_sports\``);
        await queryRunner.query(`DROP TABLE \`team_sports\``);
        await queryRunner.query(`DROP INDEX \`IDX_838312bddf12c427e3f66657ff\` ON \`sports\``);
        await queryRunner.query(`DROP TABLE \`sports\``);
        await queryRunner.query(`DROP INDEX \`IDX_9736c84fd2654d2dd894b8bb88\` ON \`players\``);
        await queryRunner.query(`DROP TABLE \`players\``);
        await queryRunner.query(`DROP INDEX \`uk_player_skill\` ON \`player_skills\``);
        await queryRunner.query(`DROP TABLE \`player_skills\``);
        await queryRunner.query(`DROP INDEX \`IDX_81f05095507fd84aa2769b4a52\` ON \`skills\``);
        await queryRunner.query(`DROP TABLE \`skills\``);
    }

}
