import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AuthenticatedUser } from "../../shared/auth/jwt.strategy.js";
import { CreateSimulationSessionDto } from "./dto/create-session.dto.js";
import { SessionEventBatchDto } from "./dto/session-event.dto.js";
import {
  SimulationSession,
  SimulationSessionDocument
} from "./schemas/simulation-session.schema.js";

@Injectable()
export class SimulationSessionsService {
  constructor(
    @InjectModel(SimulationSession.name)
    private readonly sessionModel: Model<SimulationSessionDocument>
  ) {}

  async create(user: AuthenticatedUser, payload: CreateSimulationSessionDto) {
    const session = await this.sessionModel.create({
      userId: user.sub,
      scenarioId: payload.scenarioId,
      courseId: payload.courseId ?? null,
      moduleIndex: payload.moduleIndex ?? null,
      enrollmentId: payload.enrollmentId ?? null,
      status: "started",
      events: [],
      startedAt: new Date()
    });
    return this.serialize(session);
  }

  async addEvents(sessionId: string, payload: SessionEventBatchDto) {
    if (!Types.ObjectId.isValid(sessionId))
      throw new NotFoundException("Sesión no encontrada.");

    const now = new Date().toISOString();
    const newEvents = payload.events.map((e) => ({ ...e, at: now }));

    const session = await this.sessionModel
      .findByIdAndUpdate(
        sessionId,
        { $push: { events: { $each: newEvents } } },
        { new: true }
      )
      .exec();

    if (!session) throw new NotFoundException("Sesión no encontrada.");
    return { sessionId, received: payload.events.length };
  }

  async complete(sessionId: string, score?: number) {
    if (!Types.ObjectId.isValid(sessionId))
      throw new NotFoundException("Sesión no encontrada.");

    const session = await this.sessionModel
      .findByIdAndUpdate(
        sessionId,
        { status: "completed", completedAt: new Date(), ...(score != null ? { score } : {}) },
        { new: true }
      )
      .exec();

    if (!session) throw new NotFoundException("Sesión no encontrada.");
    return this.serialize(session);
  }

  async getResults(sessionId: string) {
    if (!Types.ObjectId.isValid(sessionId))
      throw new NotFoundException("Sesión no encontrada.");

    const session = await this.sessionModel.findById(sessionId).exec();
    if (!session) throw new NotFoundException("Sesión no encontrada.");

    return {
      sessionId: session.id as string,
      status: session.status,
      score: session.score,
      eventCount: session.events.length,
      lastEventAt: session.events.at(-1)?.at ?? null,
      completedAt: session.completedAt
    };
  }

  async findByUser(userId: string) {
    const sessions = await this.sessionModel
      .find({ userId })
      .sort({ startedAt: -1 })
      .limit(50)
      .exec();
    return sessions.map((s) => this.serialize(s));
  }

  private serialize(s: SimulationSessionDocument) {
    return {
      id: s.id as string,
      userId: s.userId,
      scenarioId: s.scenarioId,
      courseId: s.courseId,
      moduleIndex: s.moduleIndex,
      enrollmentId: s.enrollmentId,
      status: s.status,
      score: s.score,
      eventCount: s.events.length,
      startedAt: s.startedAt,
      completedAt: s.completedAt
    };
  }
}
