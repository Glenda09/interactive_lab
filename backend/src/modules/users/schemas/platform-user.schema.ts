import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type PlatformUserDocument = HydratedDocument<PlatformUser>;

@Schema({
  collection: "users",
  timestamps: true,
  versionKey: false
})
export class PlatformUser {
  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: String, required: true, trim: true })
  fullName!: string;

  @Prop({ type: String, default: "active" })
  status!: "pending" | "active" | "blocked" | "suspended" | "disabled";

  @Prop({ type: [String], default: [] })
  roles!: string[];

  @Prop({ type: [String], default: [] })
  permissions!: string[];

  @Prop({ type: String, required: true })
  passwordHash!: string;

  @Prop({ type: Date, default: null })
  emailVerifiedAt!: Date | null;

  @Prop({ type: Date, default: null })
  lastLoginAt!: Date | null;

  @Prop({ type: Number, default: 0 })
  failedLoginCount!: number;

  @Prop({ type: Date, default: null })
  lockedUntil!: Date | null;

  @Prop({ type: Date, default: Date.now })
  passwordChangedAt!: Date;

  @Prop({ type: Boolean, default: false })
  requirePasswordReset!: boolean;

  @Prop({ type: Date, default: null })
  lastCredentialIssuedAt!: Date | null;

  @Prop({ type: Date, default: null })
  lastCredentialEmailSentAt!: Date | null;
}

export const PlatformUserSchema = SchemaFactory.createForClass(PlatformUser);
