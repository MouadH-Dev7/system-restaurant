import { IsEnum, IsInt, IsIP, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import type { CreatePrinterConfigInput, PrinterStatus, PrinterType } from '@repo/shared-types';

export class CreatePrinterDto implements Omit<CreatePrinterConfigInput, 'restaurantId'> {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsIP()
  ipAddress!: string;

  @IsInt()
  @Min(1)
  port!: number;

  @IsEnum(['RECEIPT', 'KITCHEN', 'BAR'])
  type!: PrinterType;

  @IsOptional()
  @IsEnum(['ONLINE', 'OFFLINE', 'LOW_PAPER'])
  status?: PrinterStatus;
}
