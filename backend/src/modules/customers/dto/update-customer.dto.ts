import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { CustomerTier, UpdateCustomerProfileInput } from '@repo/shared-types';

export class UpdateCustomerDto implements UpdateCustomerProfileInput {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

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
