import { IsOptional, IsString } from 'class-validator';

export class TableQueryDto {
  @IsOptional()
  @IsString()
  customerAppOrigin?: string;
}
