import { randomUUID } from "node:crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { AuthenticatedUser } from "../../shared/auth/jwt.strategy.js";
import { CreateSimulationSessionDto } from "./dto/create-session.dto.js";
import { SessionEventBatchDto } from "./dto/session-event.dto.js";

interface SimulationSessionRecord {
  id: string;
  userId: string;
  scenarioId: string;
  courseId?: string;
  moduleId?: string;
  status: "started" | "completed";
  startedAt: string;
  completedAt?: string;
  events: { type: string; detail: string; at: string }[];
}

@Injectable()
export class SimulationSessionsService {
  private readonly sessions = new Map<string, SimulationSessionRecord>();

  create(user: AuthenticatedUser, payload: CreateSimulationSessionDto) {
    const id = randomUUID();
    const session: SimulationSessionRecord = {
      id,
      userId: user.sub,
      scenarioId: payload.scenarioId,
      courseId: payload.courseId,
      moduleId: payload.moduleId,
      status: "started",
      startedAt: new Date().toISOString(),
      events: []
    };

    this.sessions.set(id, session);

    return session;
  }

  addEvents(sessionId: string, payload: SessionEventBatchDto) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException("Sesion no encontrada.");
    }

    session.events.push(
      ...payload.events.map((event) => ({
        ...event,
        at: new Date().toISOString()
      }))
    );

    return {
      sessionId,
      received: payload.events.length
    };
  }

  complete(sessionId: string) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException("Sesion no encontrada.");
    }

    session.status = "completed";
    session.completedAt = new Date().toISOString();

    return session;
  }

  getResults(sessionId: string) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException("Sesion no encontrada.");
    }

    return {
      sessionId: session.id,
      status: session.status,
      eventCount: session.events.length,
      lastEventAt: session.events.at(-1)?.at ?? null
    };
  }
}
