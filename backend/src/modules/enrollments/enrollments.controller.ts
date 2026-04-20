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
import { CreateEnrollmentDto, UpdateEnrollmentDto } from "./dto/create-enrollment.dto.js";
import { EnrollmentsService } from "./enrollments.service.js";

@ApiTags("enrollments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("enrollments")
export class EnrollmentsController {
  constructor(
    @Inject(EnrollmentsService)
    private readonly enrollmentsService: EnrollmentsService
  ) {}

  @Get()
  @ApiOkResponse({ description: "Todas las inscripciones (admin)." })
  findAll(@Query("userId") userId?: string, @Query("courseId") courseId?: string) {
    if (userId) return this.enrollmentsService.findByUser(userId);
    if (courseId) return this.enrollmentsService.findByCourse(courseId);
    return this.enrollmentsService.findAll();
  }

  @Get("me")
  @ApiOkResponse({ description: "Mis inscripciones activas." })
  getMyEnrollments(@CurrentUser() actor: AuthenticatedUser) {
    return this.enrollmentsService.getMyEnrollments(actor);
  }

  @Post()
  @ApiOkResponse({ description: "Inscribe un usuario en un curso (admin)." })
  enroll(@Body() body: CreateEnrollmentDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.enrollmentsService.enroll(body, actor);
  }

  @Post("self/:courseId")
  @ApiOkResponse({ description: "Auto-inscripción en un curso." })
  selfEnroll(@Param("courseId") courseId: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.enrollmentsService.selfEnroll(courseId, actor);
  }

  @Patch(":id")
  @ApiOkResponse({ description: "Actualiza estado de inscripción." })
  update(
    @Param("id") id: string,
    @Body() body: UpdateEnrollmentDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.enrollmentsService.update(id, body, actor);
  }

  @Delete(":id")
  @ApiOkResponse({ description: "Elimina una inscripción." })
  remove(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.enrollmentsService.remove(id, actor);
  }
}
