import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTicketing1794538250411 implements MigrationInterface {
    name = 'AddTicketing1794538250411'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`venue_sections\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(60) NOT NULL, \`capacity\` int NOT NULL, \`price\` decimal(12,2) NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`venue_id\` int NOT NULL, UNIQUE INDEX \`uk_venue_section_name\` (\`venue_id\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tickets\` (\`id\` int NOT NULL AUTO_INCREMENT, \`code\` varchar(20) NOT NULL, \`price\` decimal(12,2) NOT NULL, \`status\` enum ('ACTIVE', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE', \`purchased_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`cancelled_at\` datetime NULL, \`match_id\` int NOT NULL, \`fan_id\` int NOT NULL, \`section_id\` int NOT NULL, UNIQUE INDEX \`IDX_c6e20a830c0f8b571abd331b77\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`venue_sections\` ADD CONSTRAINT \`FK_52d27f30c857c90b80fd501185c\` FOREIGN KEY (\`venue_id\`) REFERENCES \`venues\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_a7a1d2cdecd49fe07abe004ae3f\` FOREIGN KEY (\`match_id\`) REFERENCES \`matches\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_94e6200832dff74007f96225784\` FOREIGN KEY (\`fan_id\`) REFERENCES \`fans\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_3eb8d5dac79061eea1650feb2ba\` FOREIGN KEY (\`section_id\`) REFERENCES \`venue_sections\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_3eb8d5dac79061eea1650feb2ba\``);
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_94e6200832dff74007f96225784\``);
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_a7a1d2cdecd49fe07abe004ae3f\``);
        await queryRunner.query(`ALTER TABLE \`venue_sections\` DROP FOREIGN KEY \`FK_52d27f30c857c90b80fd501185c\``);
        await queryRunner.query(`DROP INDEX \`IDX_c6e20a830c0f8b571abd331b77\` ON \`tickets\``);
        await queryRunner.query(`DROP TABLE \`tickets\``);
        await queryRunner.query(`DROP INDEX \`uk_venue_section_name\` ON \`venue_sections\``);
        await queryRunner.query(`DROP TABLE \`venue_sections\``);
    }

}
