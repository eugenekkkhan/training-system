import { IsNumber, Min, Max } from 'class-validator';

export class GenerateCardsDto {
  @IsNumber()
  @Min(1)
  @Max(200)
  count: number;
}
