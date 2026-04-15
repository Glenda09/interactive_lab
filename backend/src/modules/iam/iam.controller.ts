import { Body, Controller, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { FastifyRequest } from "fastify";
import { CurrentUser } from "../../shared/auth/current-user.decorator.js";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard.js";
import { AuthenticatedUser } from "../../shared/auth/jwt.strategy.js";
import { ChangePasswordDto } from "./dto/change-password.dto.js";
import { ForgotPasswordDto } from "./dto/forgot-password.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { LogoutDto } from "./dto/logout.dto.js";
import { RefreshTokenDto } from "./dto/refresh-token.dto.js";
import { ResetPasswordDto } from "./dto/reset-password.dto.js";
import { IamService } from "./iam.service.js";

@ApiTags("auth")
@Controller("auth")
export class IamController {
  constructor(private readonly iamService: IamService) {}

  @Post("login")
  @HttpCode(200)
  @ApiOkResponse({ description: "Autentica un usuario y emite tokens." })
  login(@Body() body: LoginDto, @Req() request: FastifyRequest) {
    return this.iamService.login(body.email, body.password, request);
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiOkResponse({ description: "Rota el access token usando refresh token." })
  refresh(@Body() body: RefreshTokenDto, @Req() request: FastifyRequest) {
    return this.iamService.refresh(body.refreshToken, request);
  }

  @Post("logout")
  @HttpCode(200)
  @ApiOkResponse({ description: "Revoca el refresh token entregado por el cliente." })
  logout(@Body() body: LogoutDto) {
    return this.iamService.logout(body.refreshToken);
  }

  @Post("forgot-password")
  @HttpCode(200)
  @ApiOkResponse({
    description: "Inicia la recuperacion sin revelar si el email existe o no."
  })
  forgotPassword(@Body() body: ForgotPasswordDto, @Req() request: FastifyRequest) {
    return this.iamService.forgotPassword(body.email, request);
  }

  @Post("reset-password")
  @HttpCode(200)
  @ApiOkResponse({ description: "Restablece la contrasena usando un token one-time." })
  resetPassword(@Body() body: ResetPasswordDto, @Req() request: FastifyRequest) {
    return this.iamService.resetPassword(body.token, body.newPassword, request);
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOkResponse({ description: "Cambia la contrasena del usuario autenticado." })
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChangePasswordDto,
    @Req() request: FastifyRequest
  ) {
    return this.iamService.changePassword(user.sub, body.currentPassword, body.newPassword, request);
  }
}
