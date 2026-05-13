import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateLogDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;
}
