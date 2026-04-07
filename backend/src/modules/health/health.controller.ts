import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOkResponse({ description: "Health check basico del servicio." })
  getHealth() {
    return {
      status: "ok",
      service: "interactive-lab-backend",
      timestamp: new Date().toISOString()
    };
  }
}

