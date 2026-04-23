import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { IsString } from "class-validator";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../shared/auth/current-user.decorator.js";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard.js";
import { AuthenticatedUser } from "../../shared/auth/jwt.strategy.js";
import { CreateScenarioDto } from "./dto/create-scenario.dto.js";
import { ScenariosService } from "./scenarios.service.js";

class AnalyzeImageDto {
  @IsString()
  imageUrl!: string;
}

@ApiTags("scenarios")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("scenarios")
export class ScenariosController {
  constructor(@Inject(ScenariosService) private readonly scenariosService: ScenariosService) {}

  @Post("analyze-image")
  @ApiOkResponse({ description: "Análisis de imagen con IA para sugerir configuración 3D." })
  analyzeImage(@Body() body: AnalyzeImageDto) {
    return this.scenariosService.analyzeImage(body.imageUrl);
  }

  @Get()
  @ApiOkResponse({ description: "Listado de escenarios 3D." })
  findAll(@Query("published") published?: string) {
    return this.scenariosService.findAll(published === "true");
  }

  @Get(":id")
  @ApiOkResponse({ description: "Detalle de un escenario." })
  findOne(@Param("id") id: string) {
    return this.scenariosService.findById(id);
  }

  @Post()
  @ApiOkResponse({ description: "Crea un escenario." })
  create(@Body() body: CreateScenarioDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.scenariosService.create(body, actor);
  }

  @Patch(":id")
  @ApiOkResponse({ description: "Actualiza un escenario." })
  update(
    @Param("id") id: string,
    @Body() body: Partial<CreateScenarioDto>,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.scenariosService.update(id, body, actor);
  }

  @Delete(":id")
  @ApiOkResponse({ description: "Elimina un escenario." })
  remove(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.scenariosService.remove(id, actor);
  }
}
