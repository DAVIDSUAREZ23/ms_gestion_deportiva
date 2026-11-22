import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentCatalogs1795400000000 implements MigrationInterface {
    name = 'AddPaymentCatalogs1795400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`payment_methods\` (\`id\` int NOT NULL AUTO_INCREMENT, \`code\` varchar(30) NOT NULL, \`name\` varchar(60) NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`uk_payment_method_code\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`payment_gateways\` (\`id\` int NOT NULL AUTO_INCREMENT, \`code\` varchar(30) NOT NULL, \`name\` varchar(60) NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`sandbox\` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX \`uk_payment_gateway_code\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`INSERT INTO \`payment_methods\` (\`code\`, \`name\`) VALUES ('CARD', 'Tarjeta débito/crédito'), ('PSE', 'PSE'), ('NEQUI', 'Nequi'), ('CASH', 'Efectivo')`);
        await queryRunner.query(`INSERT INTO \`payment_gateways\` (\`code\`, \`name\`, \`sandbox\`) VALUES ('WOMPI', 'Wompi', 1), ('PAYU', 'PayU', 1), ('MERCADOPAGO', 'Mercado Pago', 1), ('NONE', 'Sin pasarela', 0)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`payment_gateways\``);
        await queryRunner.query(`DROP TABLE \`payment_methods\``);
    }

}
