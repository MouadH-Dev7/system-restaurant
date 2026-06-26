import { IsEnum, IsInt, IsIP, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import type { PrinterStatus, PrinterType, UpdatePrinterConfigInput } from '@repo/shared-types';

export class UpdatePrinterDto implements UpdatePrinterConfigInput {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  port?: number;

  @IsOptional()
  @IsEnum(['RECEIPT', 'KITCHEN', 'BAR'])
  type?: PrinterType;

  @IsOptional()
  @IsEnum(['ONLINE', 'OFFLINE', 'LOW_PAPER'])
  status?: PrinterStatus;
}
