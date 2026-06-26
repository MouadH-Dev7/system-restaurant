import { AuditLogModule, AuditLogStatus, UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListLogsQueryDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(AuditLogModule)
  module?: AuditLogModule;

  @IsOptional()
  @IsEnum(AuditLogStatus)
  status?: AuditLogStatus;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  staffCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderNumber?: number;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
