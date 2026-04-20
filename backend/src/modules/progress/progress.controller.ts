import { Controller, Get, Inject, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../shared/auth/current-user.decorator.js";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard.js";
import { AuthenticatedUser } from "../../shared/auth/jwt.strategy.js";
import { ProgressService } from "./progress.service.js";

@ApiTags("progress")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("progress")
export class ProgressController {
  constructor(@Inject(ProgressService) private readonly progressService: ProgressService) {}

  @Get("me")
  @ApiOkResponse({ description: "Mi progreso en todos los cursos." })
  getMyProgress(@CurrentUser() actor: AuthenticatedUser) {
    return this.progressService.getMyProgress(actor);
  }

  @Get()
  @ApiOkResponse({ description: "Progreso de un usuario en un curso (admin)." })
  getProgress(@Query("userId") userId: string, @Query("courseId") courseId: string) {
    return this.progressService.getProgressByEnrollment(courseId, userId);
  }

  @Get(":courseId")
  @ApiOkResponse({ description: "Mi progreso en un curso específico." })
  getMyCourseProgress(
    @Param("courseId") courseId: string,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.progressService.getProgressByEnrollment(courseId, actor.sub);
  }
}
