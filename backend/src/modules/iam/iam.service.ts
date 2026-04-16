import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import * as argon2 from "argon2";
import { FastifyRequest } from "fastify";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Model } from "mongoose";
import { MailService } from "../../shared/mail/mail.service.js";
import { UsersService } from "../users/users.service.js";
import {
  AuthRefreshToken,
  AuthRefreshTokenDocument
} from "./schemas/auth-refresh-token.schema.js";
import {
  PasswordResetToken,
  PasswordResetTokenDocument
} from "./schemas/password-reset-token.schema.js";

interface RequestContext {
  ipAddress: string | null;
  userAgent: string | null;
}

@Injectable()
export class IamService {
  private readonly logger = new Logger(IamService.name);
  private dummyPasswordHash = "";

  constructor(
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(MailService)
    private readonly mailService: MailService,
    @InjectModel(AuthRefreshToken.name)
    private readonly refreshTokenModel: Model<AuthRefreshTokenDocument>,
    @InjectModel(PasswordResetToken.name)
    private readonly passwordResetTokenModel: Model<PasswordResetTokenDocument>
  ) {
    void this.initializeDummyPasswordHash();
  }

  async login(email: string, password: string, request: FastifyRequest) {
    const context = this.getRequestContext(request);
    const normalizedEmail = email.toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      await this.consumeDummyPassword(password);
      this.audit("login.failed", {
        email: normalizedEmail,
        reason: "invalid_credentials",
        ...context
      });
      throw new UnauthorizedException("Credenciales invalidas o acceso no permitido.");
    }

    if (this.isUserLocked(user.lockedUntil)) {
      this.audit("login.blocked", {
        userId: user.id,
        email: user.email,
        reason: "temporary_lock",
        ...context
      });
      throw new UnauthorizedException("Credenciales invalidas o acceso no permitido.");
    }

    const passwordIsValid = await this.usersService.validatePassword(user, password);
    const maxFailedLoginAttempts =
      this.configService.get<number>("auth.maxFailedLoginAttempts") ?? 5;
    const accountLockMinutes = this.configService.get<number>("auth.accountLockMinutes") ?? 15;

    if (!passwordIsValid) {
      const attemptState = await this.usersService.recordFailedLoginAttempt(
        user.id,
        maxFailedLoginAttempts,
        accountLockMinutes
      );

      this.audit("login.failed", {
        userId: user.id,
        email: user.email,
        reason: attemptState?.lockedUntil ? "temporary_lock" : "invalid_credentials",
        ...context
      });

      throw new UnauthorizedException("Credenciales invalidas o acceso no permitido.");
    }

    if (!this.isAllowedToAuthenticate(user.status)) {
      this.audit("login.denied", {
        userId: user.id,
        email: user.email,
        reason: user.status,
        ...context
      });
      throw new UnauthorizedException("Credenciales invalidas o acceso no permitido.");
    }

    await this.usersService.recordSuccessfulLogin(user.id);
    this.audit("login.success", {
      userId: user.id,
      email: user.email,
      ...context
    });

    return this.issueTokens(
      user.id,
      user.email,
      user.fullName,
      user.status,
      user.requirePasswordReset,
      user.roles,
      user.permissions,
      context
    );
  }

  async refresh(refreshToken: string, request: FastifyRequest) {
    const context = this.getRequestContext(request);
    const refreshTokenHash = this.hashToken(refreshToken);

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        roles: string[];
        permissions: string[];
        sid: string;
        type?: string;
      }>(refreshToken, {
        secret: this.configService.getOrThrow<string>("auth.refreshSecret")
      });

      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Refresh token invalido o expirado.");
      }

      const tokenRecord = await this.refreshTokenModel
        .findOne({
          tokenHash: refreshTokenHash,
          revokedAt: null,
          expiresAt: { $gt: new Date() }
        })
        .exec();

      if (!tokenRecord || tokenRecord.userId.toString() !== payload.sub) {
        throw new UnauthorizedException("Refresh token invalido o expirado.");
      }

      const user = await this.usersService.findAuthUserById(payload.sub);

      if (!user || !this.isAllowedToAuthenticate(user.status)) {
        throw new UnauthorizedException("Refresh token invalido o expirado.");
      }

      await this.refreshTokenModel
        .findByIdAndUpdate(tokenRecord.id, {
          lastUsedAt: new Date()
        })
        .exec();

      this.audit("token.refresh.success", {
        userId: payload.sub,
        email: payload.email,
        sessionId: payload.sid,
        ...context
      });

      return this.issueTokens(
        payload.sub,
        user.email,
        user.fullName,
        user.status,
        user.requirePasswordReset,
        user.roles,
        user.permissions,
        context,
        {
          rotateFromTokenHash: refreshTokenHash,
          sessionId: payload.sid
        }
      );
    } catch {
      this.audit("token.refresh.failed", {
        reason: "invalid_refresh_token",
        ...context
      });
      throw new UnauthorizedException("Refresh token invalido o expirado.");
    }
  }

  async logout(refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);

    await this.refreshTokenModel
      .findOneAndUpdate(
        {
          tokenHash: refreshTokenHash,
          revokedAt: null
        },
        {
          revokedAt: new Date(),
          revokedReason: "logout"
        }
      )
      .exec();

    this.audit("logout", {
      tokenHash: refreshTokenHash
    });

    return {
      success: true,
      message: "Logout completado."
    };
  }

  async forgotPassword(email: string, request: FastifyRequest) {
    const context = this.getRequestContext(request);
    const normalizedEmail = email.toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user || user.status !== "active") {
      this.audit("password_reset.requested", {
        email: normalizedEmail,
        reason: "user_not_available",
        ...context
      });
      return this.getForgotPasswordResponse();
    }

    await this.passwordResetTokenModel
      .updateMany(
        {
          userId: user._id,
          usedAt: null,
          expiresAt: { $gt: new Date() }
        },
        {
          expiresAt: new Date(),
          consumedIp: context.ipAddress,
          consumedUserAgent: context.userAgent
        }
      )
      .exec();

    const rawResetToken = randomBytes(32).toString("hex");
    const resetTokenHash = this.hashToken(rawResetToken);
    const passwordResetTtlMinutes =
      this.configService.get<number>("auth.passwordResetTtlMinutes") ?? 30;
    const expiresAt = new Date(Date.now() + passwordResetTtlMinutes * 60 * 1000);

    await this.passwordResetTokenModel.create({
      userId: user._id,
      tokenHash: resetTokenHash,
      expiresAt,
      requestedIp: context.ipAddress,
      requestedUserAgent: context.userAgent
    });

    const resetUrl = `${this.configService.getOrThrow<string>(
      "app.frontendBaseUrl"
    )}/reset-password?token=${rawResetToken}`;

    await this.mailService.sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      resetUrl,
      expiresInMinutes: passwordResetTtlMinutes
    });

    this.audit("password_reset.requested", {
      userId: user.id,
      email: user.email,
      ...context
    });

    return this.getForgotPasswordResponse();
  }

  async resetPassword(token: string, newPassword: string, request: FastifyRequest) {
    this.assertStrongPassword(newPassword);

    const context = this.getRequestContext(request);
    const resetTokenHash = this.hashToken(token);
    const tokenRecord = await this.passwordResetTokenModel
      .findOne({
        tokenHash: resetTokenHash,
        usedAt: null,
        expiresAt: { $gt: new Date() }
      })
      .exec();

    if (!tokenRecord) {
      this.audit("password_reset.failed", {
        reason: "invalid_token",
        ...context
      });
      throw new BadRequestException("Token invalido o expirado.");
    }

    const user = await this.usersService.findAuthUserById(tokenRecord.userId.toString());

    if (!user) {
      throw new BadRequestException("Token invalido o expirado.");
    }

    await this.usersService.updatePassword(user.id, newPassword);
    await this.passwordResetTokenModel
      .findByIdAndUpdate(tokenRecord.id, {
        usedAt: new Date(),
        consumedIp: context.ipAddress,
        consumedUserAgent: context.userAgent
      })
      .exec();
    await this.usersService.revokeAllRefreshTokensForUser(user.id, "password_reset");

    this.audit("password_reset.completed", {
      userId: user.id,
      email: user.email,
      ...context
    });

    return {
      success: true,
      message: "Contrasena restablecida correctamente. Ya puedes iniciar sesion."
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    request: FastifyRequest
  ) {
    this.assertStrongPassword(newPassword);

    const context = this.getRequestContext(request);
    const user = await this.usersService.findAuthUserById(userId);

    if (!user) {
      throw new UnauthorizedException("No autorizado.");
    }

    if (!(await this.usersService.validatePassword(user, currentPassword))) {
      this.audit("password_change.failed", {
        userId,
        reason: "invalid_current_password",
        ...context
      });
      throw new UnauthorizedException("La contrasena actual es incorrecta.");
    }

    if (await this.usersService.validatePassword(user, newPassword)) {
      throw new BadRequestException(
        "La nueva contrasena debe ser diferente a la contrasena actual."
      );
    }

    await this.usersService.updatePassword(user.id, newPassword);
    await this.usersService.revokeAllRefreshTokensForUser(user.id, "password_change");

    this.audit("password_change.completed", {
      userId: user.id,
      email: user.email,
      ...context
    });

    return {
      success: true,
      message:
        "Contrasena actualizada correctamente. Por seguridad, las sesiones de refresco previas fueron revocadas."
    };
  }

  private async issueTokens(
    sub: string,
    email: string,
    fullName: string,
    status: string,
    requirePasswordReset: boolean,
    roles: string[],
    permissions: string[],
    context: RequestContext,
    options?: {
      rotateFromTokenHash?: string;
      sessionId?: string;
    }
  ) {
    const sessionId = options?.sessionId ?? randomUUID();
    const accessTokenPayload = { sub, email, roles, permissions, sid: sessionId };
    const refreshTokenPayload = {
      sub,
      email,
      roles,
      permissions,
      sid: sessionId,
      type: "refresh"
    };

    const accessToken = await this.jwtService.signAsync(accessTokenPayload);
    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload, {
      secret: this.configService.getOrThrow<string>("auth.refreshSecret"),
      jwtid: randomUUID(),
      expiresIn: this.configService.getOrThrow<`${number}${"s" | "m" | "h" | "d"}`>(
        "auth.refreshTtl"
      )
    });

    const refreshTokenHash = this.hashToken(refreshToken);
    const refreshTokenExpiresAt = this.resolveExpirationDate(
      this.configService.getOrThrow<string>("auth.refreshTtl")
    );

    if (options?.rotateFromTokenHash) {
      await this.refreshTokenModel
        .findOneAndUpdate(
          {
            tokenHash: options.rotateFromTokenHash,
            revokedAt: null
          },
          {
            revokedAt: new Date(),
            revokedReason: "rotated",
            rotatedToTokenHash: refreshTokenHash
          }
        )
        .exec();
    }

    await this.refreshTokenModel.create({
      userId: sub,
      tokenHash: refreshTokenHash,
      sessionId,
      expiresAt: refreshTokenExpiresAt,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: this.configService.getOrThrow<string>("auth.accessTtl"),
      user: {
        id: sub,
        email,
        fullName,
        status,
        requirePasswordReset,
        roles,
        permissions,
        sessionId
      }
    };
  }

  private getForgotPasswordResponse() {
    return {
      success: true,
      message:
        "Si existe una cuenta asociada a ese correo, enviaremos instrucciones para recuperar el acceso."
    };
  }

  private getRequestContext(request: FastifyRequest): RequestContext {
    return {
      ipAddress: request.ip ?? null,
      userAgent:
        typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"] : null
    };
  }

  private isUserLocked(lockedUntil: Date | null | undefined) {
    return Boolean(lockedUntil && lockedUntil.getTime() > Date.now());
  }

  private isAllowedToAuthenticate(status: string) {
    return status === "active";
  }

  private hashToken(rawToken: string) {
    return createHash("sha256").update(rawToken).digest("hex");
  }

  private resolveExpirationDate(ttl: string) {
    const match = ttl.match(/^(\d+)([smhd])$/);

    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = Number(match[1]);
    const unit = match[2] as "s" | "m" | "h" | "d";
    const multipliers = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }

  private assertStrongPassword(password: string) {
    const isValid =
      password.length >= 12 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!isValid) {
      throw new BadRequestException(
        "La contrasena debe tener al menos 12 caracteres, mayusculas, minusculas, numeros y simbolos."
      );
    }
  }

  private async initializeDummyPasswordHash() {
    const randomValue = randomBytes(16).toString("hex");
    this.dummyPasswordHash = await argon2.hash(randomValue);
  }

  private async consumeDummyPassword(password: string) {
    if (!this.dummyPasswordHash) {
      await this.initializeDummyPasswordHash();
    }

    await argon2.verify(this.dummyPasswordHash, password).catch(() => false);
  }

  private audit(event: string, data: Record<string, unknown>) {
    this.logger.log(
      JSON.stringify({
        type: "security_event",
        event,
        at: new Date().toISOString(),
        ...data
      })
    );
  }
}
