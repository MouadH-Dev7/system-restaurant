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
import type { UpdateStaffInput, UserRole } from '@repo/shared-types';

export class UpdateUserDto implements UpdateStaffInput {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(['ADMIN', 'MANAGER', 'CHEF', 'CASHIER', 'WAITER'])
  role?: UserRole;

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

  @IsOptional()
  @IsString()
  @IsAlphanumeric()
  @MaxLength(32)
  staffCode?: string;

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
