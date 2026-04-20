import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AuthenticatedUser } from "../../shared/auth/jwt.strategy.js";
import { Progress, ProgressDocument } from "./schemas/progress.schema.js";

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(Progress.name)
    private readonly progressModel: Model<ProgressDocument>
  ) {}

  async getOrCreate(userId: string, courseId: string, enrollmentId: string, totalModules: number) {
    let progress = await this.progressModel.findOne({ userId, courseId }).exec();

    if (!progress) {
      const modules = Array.from({ length: totalModules }, (_, i) => ({
        moduleIndex: i,
        status: "pending" as const,
        completedAt: null,
        attempts: 0,
        bestScore: null,
        lastSessionId: null
      }));
      progress = await this.progressModel.create({
        userId,
        courseId,
        enrollmentId,
        modules,
        progressPct: 0,
        completedAt: null
      });
    }

    return this.serialize(progress);
  }

  async recordModuleAttempt(
    userId: string,
    courseId: string,
    moduleIndex: number,
    sessionId: string,
    score: number | null
  ) {
    const progress = await this.progressModel.findOne({ userId, courseId }).exec();
    if (!progress) throw new NotFoundException("Progreso no encontrado.");

    const moduleProgress = progress.modules.find((m) => m.moduleIndex === moduleIndex);
    if (!moduleProgress) throw new NotFoundException("Módulo no encontrado en el progreso.");

    moduleProgress.attempts += 1;
    moduleProgress.lastSessionId = sessionId;

    if (score != null && (moduleProgress.bestScore == null || score > moduleProgress.bestScore)) {
      moduleProgress.bestScore = score;
    }

    if (moduleProgress.status !== "completed") {
      moduleProgress.status = score != null && score >= 70 ? "completed" : "in_progress";
      if (moduleProgress.status === "completed") {
        moduleProgress.completedAt = new Date();
      }
    }

    const completed = progress.modules.filter((m) => m.status === "completed").length;
    progress.progressPct = Math.round((completed / progress.modules.length) * 100);

    if (progress.progressPct === 100 && !progress.completedAt) {
      progress.completedAt = new Date();
    }

    await progress.save();
    return this.serialize(progress);
  }

  async getMyProgress(actor: AuthenticatedUser) {
    const records = await this.progressModel.find({ userId: actor.sub }).exec();
    return records.map((p) => this.serialize(p));
  }

  async getProgressByEnrollment(courseId: string, userId: string) {
    const progress = await this.progressModel.findOne({ userId, courseId }).exec();
    if (!progress) throw new NotFoundException("Progreso no encontrado.");
    return this.serialize(progress);
  }

  private serialize(p: ProgressDocument) {
    return {
      id: p.id as string,
      userId: p.userId,
      courseId: p.courseId,
      enrollmentId: p.enrollmentId,
      modules: p.modules,
      progressPct: p.progressPct,
      completedAt: p.completedAt,
      updatedAt: (p as unknown as { updatedAt: Date }).updatedAt ?? null
    };
  }
}
