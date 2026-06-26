import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { UpsertSettingsInput } from '@repo/shared-types';

export class UpsertSettingsDto implements Omit<UpsertSettingsInput, 'restaurantId'> {
  @IsString()
  @MaxLength(160)
  restaurantName!: string;

  @IsString()
  @MaxLength(40)
  contactPhone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactEmail!: string | null;

  @IsString()
  @MaxLength(240)
  businessAddress!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  receiptLogoUrl!: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  receiptFooterMessage!: string | null;

  @IsString()
  @MaxLength(20)
  openingHours!: string;

  @IsString()
  @MaxLength(20)
  closingHours!: string;

  @IsString()
  @MaxLength(12)
  currency!: string;

  @IsNumber()
  salesTax!: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  defaultDiscountLabel!: string | null;

  @IsNumber()
  maxAutoDiscountPercent!: number;

  @IsNumber()
  refundAlertThreshold!: number;

  @IsString()
  @MaxLength(16)
  language!: string;

  @IsString()
  direction!: 'ltr' | 'rtl';

  @IsString()
  @MaxLength(16)
  locale!: string;

  @IsString()
  @MaxLength(24)
  dateFormat!: string;

  @IsBoolean()
  acceptsCash!: boolean;

  @IsBoolean()
  acceptsCard!: boolean;

  @IsBoolean()
  acceptsQrOrdering!: boolean;

  @IsBoolean()
  kitchenPrintingEnabled!: boolean;

  @IsBoolean()
  stripeEnabled!: boolean;

  @IsBoolean()
  whatsappEnabled!: boolean;

  @IsBoolean()
  smtpEnabled!: boolean;
}
