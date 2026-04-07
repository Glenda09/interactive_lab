import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CreateSimulationSessionDto {
  @ApiProperty({ example: "scenario_001" })
  @IsString()
  scenarioId!: string;

  @ApiProperty({ example: "course_001", required: false })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ example: "module_001", required: false })
  @IsOptional()
  @IsString()
  moduleId?: string;
}

