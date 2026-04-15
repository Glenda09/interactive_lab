import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength
} from "class-validator";

const userStatuses = ["active", "suspended", "blocked", "disabled"] as const;

export class UpdateUserDto {
  @ApiPropertyOptional({ example: "Instructor Senior Maria Gomez" })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({ example: "maria.gomez@interactive-lab.local" })
  @IsOptional()
  @IsEmail()
  email?: string;

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

  @ApiPropertyOptional({ enum: userStatuses })
  @IsOptional()
  @IsIn(userStatuses)
  status?: (typeof userStatuses)[number];
}
