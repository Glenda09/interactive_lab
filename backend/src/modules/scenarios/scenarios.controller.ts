import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard.js";
import { ScenariosService } from "./scenarios.service.js";

@ApiTags("scenarios")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("scenarios")
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @Get()
  @ApiOkResponse({ description: "Escenarios 3D publicados para uso en frontend." })
  getScenarios() {
    return this.scenariosService.findAll();
  }
}

