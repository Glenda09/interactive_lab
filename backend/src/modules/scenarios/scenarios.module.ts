import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ScenariosController } from "./scenarios.controller.js";
import { ScenariosService } from "./scenarios.service.js";
import { Scenario, ScenarioSchema } from "./schemas/scenario.schema.js";

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Scenario.name, schema: ScenarioSchema }])
  ],
  controllers: [ScenariosController],
  providers: [ScenariosService],
  exports: [ScenariosService]
})
export class ScenariosModule {}
