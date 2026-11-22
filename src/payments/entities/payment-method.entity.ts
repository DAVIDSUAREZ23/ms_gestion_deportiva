import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Método de pago que el aficionado elige al apostar (tarjeta, PSE, Nequi, efectivo...)
@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id!: number;

  // Código corto y único que usa el frontend, p. ej. CARD
  @Column({ length: 30, unique: true })
  code!: string;

  @Column({ length: 60 })
  name!: string;

  @Column({ default: true })
  active!: boolean;
}
