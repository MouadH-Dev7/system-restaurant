import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { CreateCustomerProfileInput, CustomerTier } from '@repo/shared-types';

export class CreateCustomerDto implements Omit<CreateCustomerProfileInput, 'restaurantId'> {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(40)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsEnum(['NEW', 'REGULAR', 'VIP'])
  tier?: CustomerTier;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
