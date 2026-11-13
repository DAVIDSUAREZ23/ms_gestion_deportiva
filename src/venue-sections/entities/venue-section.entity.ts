import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { DecimalTransformer } from '../../common/transformers/decimal.transformer';
import { Venue } from '../../venues/entities/venue.entity';

// Localidad: zona de un escenario (oriental, occidental, palco...) con su cupo y su precio
@Entity('venue_sections')
@Unique('uk_venue_section_name', ['venue', 'name'])
export class VenueSection {
  @PrimaryGeneratedColumn()
  id!: number;

  // Las localidades son configuración del escenario: si el escenario se elimina (solo sin partidos), se van con él
  @ManyToOne(() => Venue, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venue_id' })
  venue!: Venue;

  @Column({ length: 60 })
  name!: string;

  @Column({ type: 'int' })
  capacity!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: DecimalTransformer })
  price!: number;

  @Column({ default: true })
  active!: boolean;
}
