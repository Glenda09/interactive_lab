import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength
} from "class-validator";

const userStatuses = ["active", "suspended", "blocked", "disabled"] as const;

export class CreateUserDto {
  @ApiProperty({ example: "Instructor Maria Gomez" })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: "maria.gomez@interactive-lab.local" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: ["instructor"] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  roles?: string[];

  @ApiPropertyOptional({ example: ["courses.read", "assessments.grade"] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({ enum: userStatuses, default: "active" })
  @IsOptional()
  @IsIn(userStatuses)
  status?: (typeof userStatuses)[number];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  sendCredentialsEmail?: boolean;
}
