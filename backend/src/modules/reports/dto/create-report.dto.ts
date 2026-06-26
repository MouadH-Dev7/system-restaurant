import { IsDateString, IsIn, IsString, MaxLength } from 'class-validator';
import type { CreateReportExportJobInput, ReportType } from '@repo/shared-types';

export class CreateReportDto implements Omit<CreateReportExportJobInput, 'restaurantId'> {
  @IsIn([
    'FINANCIAL',
    'OPERATIONS',
    'PRINTING',
    'INVENTORY',
    'CUSTOMERS',
    'PAYMENTS',
    'DISCOUNTS',
    'FINANCIAL_AUDIT',
  ])
  type!: ReportType;

  @IsString()
  @MaxLength(180)
  name!: string;

  @IsIn(['CSV', 'JSON'])
  format!: 'CSV' | 'JSON';

  @IsDateString()
  rangeStart!: string;

  @IsDateString()
  rangeEnd!: string;
}
