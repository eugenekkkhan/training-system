import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  dailyGoal?: number;

  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;
}
