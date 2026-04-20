import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type CourseDocument = HydratedDocument<Course>;

export class CourseModule {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, default: "" })
  description!: string;

  @Prop({ type: Number, required: true })
  order!: number;

  @Prop({ type: String, default: null })
  scenarioId!: string | null;

  @Prop({ type: Number, default: 30 })
  estimatedMinutes!: number;

  @Prop({ type: String, default: "simulation" })
  type!: "simulation" | "theory" | "assessment";
}

@Schema({
  collection: "courses",
  timestamps: true,
  versionKey: false
})
export class Course {
  @Prop({ type: String, required: true, unique: true, uppercase: true, trim: true })
  code!: string;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, default: "" })
  description!: string;

  @Prop({ type: String, default: "industrial" })
  category!: string;

  @Prop({ type: String, default: "beginner" })
  level!: "beginner" | "intermediate" | "advanced";

  @Prop({ type: String, default: "draft" })
  status!: "draft" | "published" | "archived";

  @Prop({ type: String, default: null })
  coverImageUrl!: string | null;

  @Prop({ type: Number, default: 0 })
  estimatedHours!: number;

  @Prop({ type: [String], default: [] })
  objectives!: string[];

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [Object], default: [] })
  modules!: CourseModule[];

  @Prop({ type: String, default: null })
  createdBy!: string | null;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
