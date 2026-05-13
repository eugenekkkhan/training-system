import { IsString, IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID()
  cardId: string;

  @IsString()
  userAnswer: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  quality?: number;
}
