import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../shared/auth/current-user.decorator.js";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard.js";
import { AuthenticatedUser } from "../../shared/auth/jwt.strategy.js";
import { UsersService } from "./users.service.js";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @ApiOkResponse({ description: "Perfil del usuario autenticado." })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.sub);
  }

  @Get("users")
  @ApiOkResponse({ description: "Listado inicial de usuarios para administracion." })
  getUsers() {
    return this.usersService.findAll();
  }
}

