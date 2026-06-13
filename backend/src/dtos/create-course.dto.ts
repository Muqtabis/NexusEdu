import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @MinLength(3, { message: 'Course name must be at least 3 characters' })
  name: string;

  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  description: string;

  @IsOptional()
  @IsString()
  instructor?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
