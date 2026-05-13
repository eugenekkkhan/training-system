import { IsString, IsOptional } from 'class-validator';

export class CreateCardDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;
}
