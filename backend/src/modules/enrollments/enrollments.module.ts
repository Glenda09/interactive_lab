import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EnrollmentsController } from "./enrollments.controller.js";
import { EnrollmentsService } from "./enrollments.service.js";
import { Enrollment, EnrollmentSchema } from "./schemas/enrollment.schema.js";

@Module({
  imports: [MongooseModule.forFeature([{ name: Enrollment.name, schema: EnrollmentSchema }])],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService]
})
export class EnrollmentsModule {}
