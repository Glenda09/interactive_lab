import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({ example: "admin@interactive-lab.local" })
  @IsEmail()
  email!: string;
}
