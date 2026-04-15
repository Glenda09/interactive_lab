import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { PlatformUser } from "../../users/schemas/platform-user.schema.js";

export type AuthRefreshTokenDocument = HydratedDocument<AuthRefreshToken>;

@Schema({
  collection: "auth_refresh_tokens",
  timestamps: true,
  versionKey: false
})
export class AuthRefreshToken {
  @Prop({ type: Types.ObjectId, ref: PlatformUser.name, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  tokenHash!: string;

  @Prop({ type: String, required: true, index: true })
  sessionId!: string;

  @Prop({ type: Date, required: true, index: true })
  expiresAt!: Date;

  @Prop({ type: Date, default: null })
  lastUsedAt!: Date | null;

  @Prop({ type: Date, default: null, index: true })
  revokedAt!: Date | null;

  @Prop({ type: String, default: null })
  revokedReason!: string | null;

  @Prop({ type: String, default: null })
  rotatedToTokenHash!: string | null;

  @Prop({ type: String, default: null })
  ipAddress!: string | null;

  @Prop({ type: String, default: null })
  userAgent!: string | null;
}

export const AuthRefreshTokenSchema = SchemaFactory.createForClass(AuthRefreshToken);
