import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { LoginDto } from "./dto/login.dto.js";
import { RefreshTokenDto } from "./dto/refresh-token.dto.js";
import { IamService } from "./iam.service.js";

@ApiTags("auth")
@Controller("auth")
export class IamController {
  constructor(private readonly iamService: IamService) {}

  @Post("login")
  @HttpCode(200)
  @ApiOkResponse({ description: "Autentica un usuario y emite tokens." })
  login(@Body() body: LoginDto) {
    return this.iamService.login(body.email, body.password);
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiOkResponse({ description: "Rota el access token usando refresh token." })
  refresh(@Body() body: RefreshTokenDto) {
    return this.iamService.refresh(body.refreshToken);
  }

  @Post("logout")
  @HttpCode(200)
  @ApiOkResponse({ description: "Logout inicial. En v1 no hay persistencia de revocacion." })
  logout() {
    return {
      success: true,
      message: "Logout aceptado. La revocacion persistente se agregara con almacenamiento de sesiones."
    };
  }
}

