import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SubmitAssignmentDto {
  @IsNumber()
  assignmentId: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
