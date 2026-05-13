import { IsString, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsObject()
  inputSchema?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;
}
