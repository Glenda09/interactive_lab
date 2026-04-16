import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags
} from "@nestjs/swagger";
import { CurrentUser } from "../../shared/auth/current-user.decorator.js";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard.js";
import { AuthenticatedUser } from "../../shared/auth/jwt.strategy.js";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { UpdateUserDto } from "./dto/update-user.dto.js";
import { UsersService } from "./users.service.js";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get("me")
  @ApiOkResponse({ description: "Perfil del usuario autenticado." })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.sub);
  }

  @Get("users")
  @ApiOkResponse({ description: "Listado inicial de usuarios para administracion." })
  getUsers(@CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.findAll(actor);
  }

  @Post("users")
  @ApiCreatedResponse({ description: "Crea un usuario y opcionalmente envia credenciales." })
  createUser(@Body() body: CreateUserDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.createUser(body, actor);
  }

  @Patch("users/:id")
  @ApiOkResponse({ description: "Actualiza datos administrativos del usuario." })
  updateUser(
    @Param("id") id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.usersService.updateUser(id, body, actor);
  }

  @Patch("users/:id/inactivate")
  @ApiOkResponse({ description: "Inactiva un usuario y revoca sus sesiones." })
  inactivateUser(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.inactivateUser(id, actor);
  }

  @Post("users/:id/send-credentials")
  @ApiOkResponse({ description: "Genera nuevas credenciales temporales y las envia por correo." })
  sendCredentials(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.sendCredentials(id, actor);
  }
}
