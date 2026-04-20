import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../shared/auth/current-user.decorator.js";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard.js";
import { AuthenticatedUser } from "../../shared/auth/jwt.strategy.js";
import { CoursesService } from "./courses.service.js";
import { CreateCourseDto } from "./dto/create-course.dto.js";
import { UpdateCourseDto } from "./dto/update-course.dto.js";

@ApiTags("courses")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("courses")
export class CoursesController {
  constructor(@Inject(CoursesService) private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOkResponse({ description: "Listado de cursos." })
  findAll(@Query("published") published?: string) {
    return this.coursesService.findAll(published === "true");
  }

  @Get(":id")
  @ApiOkResponse({ description: "Detalle de un curso." })
  findOne(@Param("id") id: string) {
    return this.coursesService.findById(id);
  }

  @Post()
  @ApiOkResponse({ description: "Crea un curso." })
  create(@Body() body: CreateCourseDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.coursesService.create(body, actor);
  }

  @Patch(":id")
  @ApiOkResponse({ description: "Actualiza un curso." })
  update(
    @Param("id") id: string,
    @Body() body: UpdateCourseDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.coursesService.update(id, body, actor);
  }

  @Delete(":id")
  @ApiOkResponse({ description: "Elimina un curso." })
  remove(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.coursesService.remove(id, actor);
  }
}
