import { IsArray, IsIn, IsObject, IsOptional, IsString, MinLength } from "class-validator";

export class CreateScenarioDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsIn(["draft", "published", "archived"])
  status?: "draft" | "published" | "archived";

  @IsOptional()
  @IsString()
  thumbnailUrl?: string | null;

  @IsOptional()
  @IsIn(["beginner", "intermediate", "advanced"])
  difficulty?: "beginner" | "intermediate" | "advanced";

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  babylonConfig?: Record<string, unknown>;
}
