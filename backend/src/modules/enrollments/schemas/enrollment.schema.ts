import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type EnrollmentDocument = HydratedDocument<Enrollment>;

@Schema({
  collection: "enrollments",
  timestamps: true,
  versionKey: false
})
export class Enrollment {
  @Prop({ type: String, required: true })
  userId!: string;

  @Prop({ type: String, required: true })
  courseId!: string;

  @Prop({ type: String, default: null })
  enrolledBy!: string | null;

  @Prop({ type: String, default: "active" })
  status!: "active" | "completed" | "dropped" | "suspended";

  @Prop({ type: Date, default: null })
  completedAt!: Date | null;

  @Prop({ type: String, default: "" })
  notes!: string;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
