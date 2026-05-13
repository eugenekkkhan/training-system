import { IsString, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateLogDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;
}
