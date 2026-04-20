import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SimulationSessionsController } from "./simulation-sessions.controller.js";
import { SimulationSessionsService } from "./simulation-sessions.service.js";
import {
  SimulationSession,
  SimulationSessionSchema
} from "./schemas/simulation-session.schema.js";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SimulationSession.name, schema: SimulationSessionSchema }
    ])
  ],
  controllers: [SimulationSessionsController],
  providers: [SimulationSessionsService],
  exports: [SimulationSessionsService]
})
export class SimulationSessionsModule {}
