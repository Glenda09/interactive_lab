import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard.js";
import { CoursesService } from "./courses.service.js";

@ApiTags("courses")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("courses")
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOkResponse({ description: "Lista inicial de cursos." })
  getCourses() {
    return this.coursesService.findAll();
  }
}

