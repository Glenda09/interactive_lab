import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class SimulationEventItemDto {
  @ApiProperty()
  @IsString()
  type!: string;

  @ApiProperty()
  @IsString()
  detail!: string;
}

export class SessionEventBatchDto {
  @ApiProperty({ type: [SimulationEventItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SimulationEventItemDto)
  events!: SimulationEventItemDto[];
}

