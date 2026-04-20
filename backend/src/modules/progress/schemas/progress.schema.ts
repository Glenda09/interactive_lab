import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ProgressDocument = HydratedDocument<Progress>;

export class ModuleProgress {
  @Prop({ type: Number, required: true })
  moduleIndex!: number;

  @Prop({ type: String, default: "pending" })
  status!: "pending" | "in_progress" | "completed";

  @Prop({ type: Date, default: null })
  completedAt!: Date | null;

  @Prop({ type: Number, default: 0 })
  attempts!: number;

  @Prop({ type: Number, default: null })
  bestScore!: number | null;

  @Prop({ type: String, default: null })
  lastSessionId!: string | null;
}

@Schema({
  collection: "progress",
  timestamps: true,
  versionKey: false
})
export class Progress {
  @Prop({ type: String, required: true })
  userId!: string;

  @Prop({ type: String, required: true })
  courseId!: string;

  @Prop({ type: String, required: true })
  enrollmentId!: string;

  @Prop({ type: [Object], default: [] })
  modules!: ModuleProgress[];

  @Prop({ type: Number, default: 0 })
  progressPct!: number;

  @Prop({ type: Date, default: null })
  completedAt!: Date | null;
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);
ProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
