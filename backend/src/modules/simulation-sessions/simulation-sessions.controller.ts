import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../shared/auth/current-user.decorator.js";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard.js";
import { AuthenticatedUser } from "../../shared/auth/jwt.strategy.js";
import { CreateSimulationSessionDto } from "./dto/create-session.dto.js";
import { SessionEventBatchDto } from "./dto/session-event.dto.js";
import { SimulationSessionsService } from "./simulation-sessions.service.js";

@ApiTags("simulation-sessions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("simulation-sessions")
export class SimulationSessionsController {
  constructor(private readonly simulationSessionsService: SimulationSessionsService) {}

  @Post()
  @ApiOkResponse({ description: "Crea una sesion de simulacion." })
  createSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateSimulationSessionDto
  ) {
    return this.simulationSessionsService.create(user, body);
  }

  @Post(":id/events/bulk")
  @ApiOkResponse({ description: "Registra lote de eventos emitidos por el runtime 3D." })
  addEvents(@Param("id") id: string, @Body() body: SessionEventBatchDto) {
    return this.simulationSessionsService.addEvents(id, body);
  }

  @Post(":id/complete")
  @ApiOkResponse({ description: "Cierra una sesion de simulacion." })
  complete(@Param("id") id: string) {
    return this.simulationSessionsService.complete(id);
  }

  @Get(":id/results")
  @ApiOkResponse({ description: "Consulta resultado resumido de la sesion." })
  getResults(@Param("id") id: string) {
    return this.simulationSessionsService.getResults(id);
  }
}

