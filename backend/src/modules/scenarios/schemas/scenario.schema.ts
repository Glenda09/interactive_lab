import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ScenarioDocument = HydratedDocument<Scenario>;

@Schema({
  collection: "scenarios",
  timestamps: true,
  versionKey: false
})
export class Scenario {
  @Prop({ type: String, required: true, unique: true, uppercase: true, trim: true })
  code!: string;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, default: "" })
  description!: string;

  @Prop({ type: String, default: "1.0.0" })
  version!: string;

  @Prop({ type: String, default: "draft" })
  status!: "draft" | "published" | "archived";

  @Prop({ type: String, default: null })
  thumbnailUrl!: string | null;

  @Prop({ type: String, default: "beginner" })
  difficulty!: "beginner" | "intermediate" | "advanced";

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: Object, default: {} })
  babylonConfig!: Record<string, unknown>;

  @Prop({ type: String, default: null })
  createdBy!: string | null;
}

export const ScenarioSchema = SchemaFactory.createForClass(Scenario);
