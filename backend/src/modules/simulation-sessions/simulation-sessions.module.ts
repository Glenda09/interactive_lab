import { Module } from "@nestjs/common";
import { SimulationSessionsController } from "./simulation-sessions.controller.js";
import { SimulationSessionsService } from "./simulation-sessions.service.js";

@Module({
  controllers: [SimulationSessionsController],
  providers: [SimulationSessionsService]
})
export class SimulationSessionsModule {}
