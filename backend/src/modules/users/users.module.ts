import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { MailModule } from "../../shared/mail/mail.module.js";
import {
  AuthRefreshToken,
  AuthRefreshTokenSchema
} from "../iam/schemas/auth-refresh-token.schema.js";
import { UsersController } from "./users.controller.js";
import { UsersService } from "./users.service.js";
import { PlatformUser, PlatformUserSchema } from "./schemas/platform-user.schema.js";

@Module({
  imports: [
    ConfigModule,
    MailModule,
    MongooseModule.forFeature([
      { name: PlatformUser.name, schema: PlatformUserSchema },
      { name: AuthRefreshToken.name, schema: AuthRefreshTokenSchema }
    ])
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
