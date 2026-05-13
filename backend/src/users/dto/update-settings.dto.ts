import { IsBoolean, IsNumber, IsObject, IsOptional, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  dailyGoal?: number;

  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsObject()
  customColors?: Record<string, string>;
}
