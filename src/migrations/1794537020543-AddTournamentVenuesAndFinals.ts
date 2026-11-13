import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTournamentVenuesAndFinals1794537020543 implements MigrationInterface {
    name = 'AddTournamentVenuesAndFinals1794537020543'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`finals\` (\`id\` int NOT NULL AUTO_INCREMENT, \`round\` enum ('ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL') NOT NULL, \`phase_id\` int NOT NULL, UNIQUE INDEX \`REL_57cc3c90993553e4864be51d23\` (\`phase_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tournament_venues\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tournament_id\` int NOT NULL, \`venue_id\` int NOT NULL, UNIQUE INDEX \`uk_tournament_venue\` (\`tournament_id\`, \`venue_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`finals\` ADD CONSTRAINT \`FK_57cc3c90993553e4864be51d237\` FOREIGN KEY (\`phase_id\`) REFERENCES \`phases\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_venues\` ADD CONSTRAINT \`FK_b5a4831bf3a9721f490690f7834\` FOREIGN KEY (\`tournament_id\`) REFERENCES \`tournaments\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_venues\` ADD CONSTRAINT \`FK_7156b8abe1720d8f50e49db8038\` FOREIGN KEY (\`venue_id\`) REFERENCES \`venues\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        // Las fases finales creadas antes de esta migración reciben su entidad Final con la ronda FINAL
        await queryRunner.query(`INSERT INTO \`finals\` (\`round\`, \`phase_id\`) SELECT 'FINAL', \`id\` FROM \`phases\` WHERE \`type\` = 'KNOCKOUT'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament_venues\` DROP FOREIGN KEY \`FK_7156b8abe1720d8f50e49db8038\``);
        await queryRunner.query(`ALTER TABLE \`tournament_venues\` DROP FOREIGN KEY \`FK_b5a4831bf3a9721f490690f7834\``);
        await queryRunner.query(`ALTER TABLE \`finals\` DROP FOREIGN KEY \`FK_57cc3c90993553e4864be51d237\``);
        await queryRunner.query(`DROP INDEX \`uk_tournament_venue\` ON \`tournament_venues\``);
        await queryRunner.query(`DROP TABLE \`tournament_venues\``);
        await queryRunner.query(`DROP INDEX \`REL_57cc3c90993553e4864be51d23\` ON \`finals\``);
        await queryRunner.query(`DROP TABLE \`finals\``);
    }

}
