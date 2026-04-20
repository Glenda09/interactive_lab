import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateSimulationSessionDto {
  @ApiProperty({ example: "scenarioObjectId" })
  @IsString()
  scenarioId!: string;

  @ApiProperty({ example: "courseObjectId", required: false })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  moduleIndex?: number;

  @ApiProperty({ example: "enrollmentObjectId", required: false })
  @IsOptional()
  @IsString()
  enrollmentId?: string;
}
