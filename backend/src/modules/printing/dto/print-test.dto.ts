import { IsOptional, IsString } from 'class-validator';

export class PrintTestDto {
  @IsOptional()
  @IsString()
  printerName?: string;
}
