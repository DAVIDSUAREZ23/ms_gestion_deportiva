import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWallets1795400200000 implements MigrationInterface {
  name = 'AddWallets1795400200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`wallets\` (\`id\` int NOT NULL AUTO_INCREMENT, \`balance\` decimal(12,2) NOT NULL DEFAULT 0, \`active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`fan_id\` int NOT NULL, UNIQUE INDEX \`uk_wallet_fan\` (\`fan_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`wallet_movements\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type\` enum ('RECHARGE', 'BET_DEBIT', 'BET_WIN', 'BET_WIN_REVERSAL', 'BET_REFUND', 'ADJUSTMENT') NOT NULL, \`amount\` decimal(12,2) NOT NULL, \`balance_after\` decimal(12,2) NOT NULL, \`reference\` varchar(100) NULL, \`reason\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`wallet_id\` int NOT NULL, \`bet_id\` int NULL, \`payment_method_id\` int NULL, \`payment_gateway_id\` int NULL, UNIQUE INDEX \`uk_wallet_movement_reference\` (\`reference\`), INDEX \`idx_wallet_movements_wallet\` (\`wallet_id\`), INDEX \`idx_wallet_movements_bet\` (\`bet_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`wallets\` ADD CONSTRAINT \`FK_wallets_fan\` FOREIGN KEY (\`fan_id\`) REFERENCES \`fans\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`wallet_movements\` ADD CONSTRAINT \`FK_wallet_movements_wallet\` FOREIGN KEY (\`wallet_id\`) REFERENCES \`wallets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`wallet_movements\` ADD CONSTRAINT \`FK_wallet_movements_bet\` FOREIGN KEY (\`bet_id\`) REFERENCES \`bets\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`wallet_movements\` ADD CONSTRAINT \`FK_wallet_movements_payment_method\` FOREIGN KEY (\`payment_method_id\`) REFERENCES \`payment_methods\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`wallet_movements\` ADD CONSTRAINT \`FK_wallet_movements_payment_gateway\` FOREIGN KEY (\`payment_gateway_id\`) REFERENCES \`payment_gateways\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Las apuestas pagadas con saldo se registran con este método; la pasarela NONE ya existe
    await queryRunner.query(`INSERT IGNORE INTO \`payment_methods\` (\`code\`, \`name\`) VALUES ('WALLET', 'Monedero')`);
    // Cada aficionado existente recibe su monedero en cero
    await queryRunner.query(`INSERT INTO \`wallets\` (\`fan_id\`, \`balance\`, \`active\`) SELECT \`id\`, 0, 1 FROM \`fans\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`wallet_movements\``);
    await queryRunner.query(`DROP TABLE \`wallets\``);
    await queryRunner.query(
      `DELETE FROM \`payment_methods\` WHERE \`code\` = 'WALLET' AND NOT EXISTS (SELECT 1 FROM \`bets\` WHERE \`bets\`.\`payment_method_id\` = \`payment_methods\`.\`id\`)`,
    );
  }
}
