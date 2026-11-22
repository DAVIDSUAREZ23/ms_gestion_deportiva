import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBetting1795400100000 implements MigrationInterface {
    name = 'AddBetting1795400100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`match_odds\` (\`id\` int NOT NULL AUTO_INCREMENT, \`selection\` enum ('HOME', 'DRAW', 'AWAY') NOT NULL, \`odds\` decimal(6,2) NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`match_id\` int NOT NULL, UNIQUE INDEX \`uk_match_odd_selection\` (\`match_id\`, \`selection\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`bets\` (\`id\` int NOT NULL AUTO_INCREMENT, \`code\` varchar(20) NOT NULL, \`selection\` enum ('HOME', 'DRAW', 'AWAY') NOT NULL, \`amount\` decimal(12,2) NOT NULL, \`odds\` decimal(6,2) NOT NULL, \`potential_payout\` decimal(12,2) NOT NULL, \`status\` enum ('PENDING_PAYMENT', 'ACTIVE', 'PAYMENT_FAILED', 'WON', 'LOST', 'VOID') NOT NULL DEFAULT 'PENDING_PAYMENT', \`payment_reference\` varchar(100) NULL, \`placed_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`paid_at\` datetime NULL, \`settled_at\` datetime NULL, \`fan_id\` int NOT NULL, \`match_id\` int NOT NULL, \`payment_method_id\` int NOT NULL, \`payment_gateway_id\` int NOT NULL, UNIQUE INDEX \`uk_bet_code\` (\`code\`), UNIQUE INDEX \`uk_bet_payment_reference\` (\`payment_reference\`), INDEX \`idx_bets_fan_match\` (\`fan_id\`, \`match_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`match_odds\` ADD CONSTRAINT \`FK_match_odds_match\` FOREIGN KEY (\`match_id\`) REFERENCES \`matches\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`bets\` ADD CONSTRAINT \`FK_bets_fan\` FOREIGN KEY (\`fan_id\`) REFERENCES \`fans\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`bets\` ADD CONSTRAINT \`FK_bets_match\` FOREIGN KEY (\`match_id\`) REFERENCES \`matches\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`bets\` ADD CONSTRAINT \`FK_bets_payment_method\` FOREIGN KEY (\`payment_method_id\`) REFERENCES \`payment_methods\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`bets\` ADD CONSTRAINT \`FK_bets_payment_gateway\` FOREIGN KEY (\`payment_gateway_id\`) REFERENCES \`payment_gateways\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`bets\` DROP FOREIGN KEY \`FK_bets_payment_gateway\``);
        await queryRunner.query(`ALTER TABLE \`bets\` DROP FOREIGN KEY \`FK_bets_payment_method\``);
        await queryRunner.query(`ALTER TABLE \`bets\` DROP FOREIGN KEY \`FK_bets_match\``);
        await queryRunner.query(`ALTER TABLE \`bets\` DROP FOREIGN KEY \`FK_bets_fan\``);
        await queryRunner.query(`ALTER TABLE \`match_odds\` DROP FOREIGN KEY \`FK_match_odds_match\``);
        await queryRunner.query(`DROP INDEX \`idx_bets_fan_match\` ON \`bets\``);
        await queryRunner.query(`DROP INDEX \`uk_bet_payment_reference\` ON \`bets\``);
        await queryRunner.query(`DROP INDEX \`uk_bet_code\` ON \`bets\``);
        await queryRunner.query(`DROP TABLE \`bets\``);
        await queryRunner.query(`DROP INDEX \`uk_match_odd_selection\` ON \`match_odds\``);
        await queryRunner.query(`DROP TABLE \`match_odds\``);
    }

}
