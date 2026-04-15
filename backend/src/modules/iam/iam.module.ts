import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtStrategy } from "../../shared/auth/jwt.strategy.js";
import { MailModule } from "../../shared/mail/mail.module.js";
import { UsersModule } from "../users/users.module.js";
import { IamController } from "./iam.controller.js";
import { IamService } from "./iam.service.js";
import {
  AuthRefreshToken,
  AuthRefreshTokenSchema
} from "./schemas/auth-refresh-token.schema.js";
import {
  PasswordResetToken,
  PasswordResetTokenSchema
} from "./schemas/password-reset-token.schema.js";

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    MailModule,
    MongooseModule.forFeature([
      { name: AuthRefreshToken.name, schema: AuthRefreshTokenSchema },
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema }
    ]),
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
