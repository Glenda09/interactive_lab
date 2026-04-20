import { IsIn, IsOptional, IsString } from "class-validator";

export class CreateEnrollmentDto {
  @IsString()
  userId!: string;

  @IsString()
  courseId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsIn(["active", "completed", "dropped", "suspended"])
  status?: "active" | "completed" | "dropped" | "suspended";

  @IsOptional()
  @IsString()
  notes?: string;
}
