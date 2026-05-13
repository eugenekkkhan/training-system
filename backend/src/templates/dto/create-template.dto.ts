import { IsString, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  code: string;

  @IsObject()
  inputSchema: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;
}
