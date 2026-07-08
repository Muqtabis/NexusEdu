import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";

export class CreateUserDto {
  @IsEmail({}, { message: "Email must be valid" })
  email: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @Matches(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter",
  })
  @Matches(/[0-9]/, { message: "Password must contain at least one number" })
  @Matches(/[!@#$%^&*]/, {
    message: "Password must contain at least one special character (!@#$%^&*)",
  })
  password: string;

  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  @MaxLength(100, { message: "Name must be less than 100 characters" })
  name: string;

  @IsOptional()
  @IsString()
  @IsIn(["student", "teacher", "admin"], {
    message: "Role must be student, teacher, or admin",
  })
  role?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsString()
  rollNumber?: string;

  @IsOptional()
  @IsString()
  secretCode?: string;
}
