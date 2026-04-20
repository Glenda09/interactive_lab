import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SimulationSessionDocument = HydratedDocument<SimulationSession>;

export class SessionEvent {
  @Prop({ type: String, required: true })
  type!: string;

  @Prop({ type: String, default: "" })
  detail!: string;

  @Prop({ type: String, required: true })
  at!: string;
}

@Schema({
  collection: "simulation_sessions",
  timestamps: true,
  versionKey: false
})
export class SimulationSession {
  @Prop({ type: String, required: true })
  userId!: string;

  @Prop({ type: String, required: true })
  scenarioId!: string;

  @Prop({ type: String, default: null })
  courseId!: string | null;

  @Prop({ type: Number, default: null })
  moduleIndex!: number | null;

  @Prop({ type: String, default: null })
  enrollmentId!: string | null;

  @Prop({ type: String, default: "started" })
  status!: "started" | "completed" | "abandoned";

  @Prop({ type: [Object], default: [] })
  events!: SessionEvent[];

  @Prop({ type: Number, default: null })
  score!: number | null;

  @Prop({ type: Date, default: Date.now })
  startedAt!: Date;

  @Prop({ type: Date, default: null })
  completedAt!: Date | null;
}

export const SimulationSessionSchema = SchemaFactory.createForClass(SimulationSession);
