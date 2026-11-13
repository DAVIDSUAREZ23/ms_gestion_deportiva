import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFans1794537643494 implements MigrationInterface {
    name = 'AddFans1794537643494'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`fan_teams\` (\`id\` int NOT NULL AUTO_INCREMENT, \`followed_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fan_id\` int NOT NULL, \`team_id\` int NOT NULL, UNIQUE INDEX \`uk_fan_team\` (\`fan_id\`, \`team_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`fans\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`display_name\` varchar(100) NOT NULL, \`email\` varchar(120) NOT NULL, \`phone\` varchar(20) NULL, \`city\` varchar(100) NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_88e36d9d3dbdb2b3f069087048\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`fan_teams\` ADD CONSTRAINT \`FK_b352da18d67f7155c77b7e61d52\` FOREIGN KEY (\`fan_id\`) REFERENCES \`fans\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`fan_teams\` ADD CONSTRAINT \`FK_1a8ce581cd8d3674c2d43cdb4da\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`fan_teams\` DROP FOREIGN KEY \`FK_1a8ce581cd8d3674c2d43cdb4da\``);
        await queryRunner.query(`ALTER TABLE \`fan_teams\` DROP FOREIGN KEY \`FK_b352da18d67f7155c77b7e61d52\``);
        await queryRunner.query(`DROP INDEX \`IDX_88e36d9d3dbdb2b3f069087048\` ON \`fans\``);
        await queryRunner.query(`DROP TABLE \`fans\``);
        await queryRunner.query(`DROP INDEX \`uk_fan_team\` ON \`fan_teams\``);
        await queryRunner.query(`DROP TABLE \`fan_teams\``);
    }

}
