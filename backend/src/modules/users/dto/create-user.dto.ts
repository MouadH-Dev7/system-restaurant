import {
  IsAlphanumeric,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { UserRole } from '@repo/shared-types';

export class CreateUserDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(['ADMIN', 'MANAGER', 'CHEF', 'CASHIER', 'WAITER'])
  role!: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nationalId?: string | null;

  @IsOptional()
  @IsString()
  birthDate?: string | null;

  @IsOptional()
  @IsString()
  hireDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string | null;

  @IsString()
  @IsAlphanumeric()
  @MaxLength(32)
  staffCode!: string;

  @IsOptional()
  @IsEnum(['MONTHLY', 'DAILY'])
  salaryType?: 'MONTHLY' | 'DAILY' | null;

  @IsOptional()
  @IsNumber()
  salaryAmount?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContactName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  emergencyContactPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
