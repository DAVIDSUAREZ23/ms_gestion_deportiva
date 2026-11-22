import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Pasarela de pagos con la que se cobra una apuesta (Wompi, PayU, Mercado Pago...)
@Entity('payment_gateways')
export class PaymentGateway {
  @PrimaryGeneratedColumn()
  id!: number;

  // Código corto y único que usa el frontend, p. ej. WOMPI
  @Column({ length: 30, unique: true })
  code!: string;

  @Column({ length: 60 })
  name!: string;

  @Column({ default: true })
  active!: boolean;

  // true mientras la pasarela se use en modo de pruebas
  @Column({ default: false })
  sandbox!: boolean;
}
