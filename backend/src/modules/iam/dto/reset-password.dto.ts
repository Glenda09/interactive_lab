import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  token!: string;

  @ApiProperty({ example: "N3wStrong#Password2026" })
  @IsString()
  @MinLength(12)
  newPassword!: string;
}
