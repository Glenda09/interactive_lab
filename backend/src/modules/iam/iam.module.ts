import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "../../shared/auth/jwt.strategy.js";
import { UsersModule } from "../users/users.module.js";
import { IamController } from "./iam.controller.js";
import { IamService } from "./iam.service.js";

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("auth.accessSecret"),
        signOptions: {
          expiresIn: configService.getOrThrow<`${number}${"s" | "m" | "h" | "d"}`>(
            "auth.accessTtl"
          )
        }
      })
    })
  ],
  controllers: [IamController],
  providers: [IamService, JwtStrategy],
  exports: [IamService]
})
export class IamModule {}
