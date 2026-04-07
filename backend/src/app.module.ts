import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import configuration from "./config/env.configuration.js";
import { HealthController } from "./modules/health/health.controller.js";
import { IamModule } from "./modules/iam/iam.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { CoursesModule } from "./modules/courses/courses.module.js";
import { ScenariosModule } from "./modules/scenarios/scenarios.module.js";
import { SimulationSessionsModule } from "./modules/simulation-sessions/simulation-sessions.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    PassportModule.register({ defaultStrategy: "jwt" }),
    IamModule,
    UsersModule,
    CoursesModule,
    ScenariosModule,
    SimulationSessionsModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
