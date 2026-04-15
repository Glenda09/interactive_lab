import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { PlatformUser } from "../../users/schemas/platform-user.schema.js";

export type PasswordResetTokenDocument = HydratedDocument<PasswordResetToken>;

@Schema({
  collection: "password_reset_tokens",
  timestamps: true,
  versionKey: false
})
export class PasswordResetToken {
  @Prop({ type: Types.ObjectId, ref: PlatformUser.name, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  tokenHash!: string;

  @Prop({ type: Date, required: true, index: true })
  expiresAt!: Date;

  @Prop({ type: Date, default: null })
  usedAt!: Date | null;

  @Prop({ type: String, default: null })
  requestedIp!: string | null;

  @Prop({ type: String, default: null })
  requestedUserAgent!: string | null;

  @Prop({ type: String, default: null })
  consumedIp!: string | null;

  @Prop({ type: String, default: null })
  consumedUserAgent!: string | null;
}

export const PasswordResetTokenSchema = SchemaFactory.createForClass(PasswordResetToken);
