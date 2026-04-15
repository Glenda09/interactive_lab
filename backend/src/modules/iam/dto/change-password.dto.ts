import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ example: "ChangeMe123!" })
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @ApiProperty({ example: "N3wStrong#Password2026" })
  @IsString()
  @MinLength(12)
  newPassword!: string;
}
