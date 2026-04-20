import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProgressController } from "./progress.controller.js";
import { ProgressService } from "./progress.service.js";
import { Progress, ProgressSchema } from "./schemas/progress.schema.js";

@Module({
  imports: [MongooseModule.forFeature([{ name: Progress.name, schema: ProgressSchema }])],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService]
})
export class ProgressModule {}
