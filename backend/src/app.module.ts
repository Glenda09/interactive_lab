import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";
import configuration from "./config/env.configuration.js";
import { HealthController } from "./modules/health/health.controller.js";
import { IamModule } from "./modules/iam/iam.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { CoursesModule } from "./modules/courses/courses.module.js";
import { ScenariosModule } from "./modules/scenarios/scenarios.module.js";
import { SimulationSessionsModule } from "./modules/simulation-sessions/simulation-sessions.module.js";
import { EnrollmentsModule } from "./modules/enrollments/enrollments.module.js";
import { ProgressModule } from "./modules/progress/progress.module.js";
import { RolesModule } from "./modules/roles/roles.module.js";
import { UploadsModule } from "./modules/uploads/uploads.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>("database.mongoUri")
      })
    }),
    PassportModule.register({ defaultStrategy: "jwt" }),
    IamModule,
    UsersModule,
    CoursesModule,
    ScenariosModule,
    SimulationSessionsModule,
    EnrollmentsModule,
    ProgressModule,
    RolesModule,
    UploadsModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
