import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import * as argon2 from "argon2";
import { randomInt } from "node:crypto";
import { Model, Types } from "mongoose";
import { AuthenticatedUser } from "../../shared/auth/jwt.strategy.js";
import { MailService } from "../../shared/mail/mail.service.js";
import {
  AuthRefreshToken,
  AuthRefreshTokenDocument
} from "../iam/schemas/auth-refresh-token.schema.js";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { UpdateUserDto } from "./dto/update-user.dto.js";
import {
  PlatformUser as PlatformUserModel,
  PlatformUserDocument
} from "./schemas/platform-user.schema.js";

export interface PlatformUserView {
  id: string;
  email: string;
  fullName: string;
  status: string;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  roles: string[];
  permissions: string[];
  requirePasswordReset: boolean;
  failedLoginCount: number;
  lockedUntil: Date | null;
  lastCredentialIssuedAt: Date | null;
  lastCredentialEmailSentAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface UserCredentialDelivery {
  status: "sent" | "logged" | "failed" | "skipped";
  mode: string;
  message: string;
}

export interface UserMutationResponse {
  user: PlatformUserView;
  message: string;
  credentialDelivery?: UserCredentialDelivery;
}

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    @InjectModel(PlatformUserModel.name)
    private readonly userModel: Model<PlatformUserDocument>,
    @InjectModel(AuthRefreshToken.name)
    private readonly refreshTokenModel: Model<AuthRefreshTokenDocument>
  ) {}

  async onModuleInit() {
    const adminPassword = this.configService.getOrThrow<string>("demoUsers.admin.password");
    const studentPassword = this.configService.getOrThrow<string>("demoUsers.student.password");

    await Promise.all([
      this.upsertDemoUser({
        email: this.configService.getOrThrow<string>("demoUsers.admin.email"),
        fullName: "Platform Admin",
        roles: ["platform_admin"],
        permissions: ["users.read", "courses.create", "scenarios.publish", "audit.read"],
        password: adminPassword
      }),
      this.upsertDemoUser({
        email: this.configService.getOrThrow<string>("demoUsers.student.email"),
        fullName: "Demo Student",
        roles: ["student"],
        permissions: ["progress.read.self", "simulations.launch"],
        password: studentPassword
      })
    ]);
  }

  async findAll(actor?: AuthenticatedUser) {
    if (actor) {
      this.assertCanReadUsers(actor);
    }

    const users = await this.userModel.find().sort({ createdAt: -1, email: 1 }).exec();
    return users.map((user) => this.serializeUser(user));
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const user = await this.userModel.findById(id).exec();
    return user ? this.serializeUser(user) : null;
  }

  findAuthUserById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return this.userModel.findById(id).exec();
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async createUser(input: CreateUserDto, actor: AuthenticatedUser): Promise<UserMutationResponse> {
    this.assertCanManageUsers(actor);

    const normalizedEmail = input.email.toLowerCase().trim();
    const existingUser = await this.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException("Ya existe un usuario con ese correo.");
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const now = new Date();
    const createdUser = await this.userModel.create({
      email: normalizedEmail,
      fullName: input.fullName.trim(),
      status: input.status ?? "active",
      roles: this.normalizeTagList(input.roles),
      permissions: this.normalizeTagList(input.permissions),
      passwordHash: await argon2.hash(temporaryPassword),
      emailVerifiedAt: null,
      passwordChangedAt: now,
      requirePasswordReset: true,
      failedLoginCount: 0,
      lockedUntil: null,
      lastCredentialIssuedAt: now,
      lastCredentialEmailSentAt: input.sendCredentialsEmail === false ? null : now
    });

    let credentialDelivery: UserCredentialDelivery | undefined;

    if (input.sendCredentialsEmail !== false) {
      credentialDelivery = await this.sendCredentialsEmail(
        createdUser,
        temporaryPassword,
        "Cuenta creada y credenciales enviadas."
      );

      if (credentialDelivery.status === "failed") {
        await this.userModel
          .findByIdAndUpdate(createdUser.id, {
            lastCredentialEmailSentAt: null
          })
          .exec();
      }
    }

    this.audit("user.created", {
      actorId: actor.sub,
      actorEmail: actor.email,
      userId: createdUser.id,
      email: createdUser.email
    });

    return {
      user: this.serializeUser(createdUser),
      message:
        input.sendCredentialsEmail === false
          ? "Usuario creado sin envio automatico de credenciales."
          : credentialDelivery?.status === "failed"
            ? "Usuario creado, pero el correo de credenciales fallo. Puedes reenviarlo desde administracion."
            : "Usuario creado correctamente.",
      credentialDelivery
    };
  }

  async updateUser(
    id: string,
    input: UpdateUserDto,
    actor: AuthenticatedUser
  ): Promise<UserMutationResponse> {
    this.assertCanManageUsers(actor);

    const user = await this.findManagedUserByIdOrThrow(id);
    const updatePayload: Record<string, unknown> = {};

    if (input.fullName !== undefined) {
      updatePayload.fullName = input.fullName.trim();
    }

    if (input.email !== undefined) {
      const normalizedEmail = input.email.toLowerCase().trim();

      if (normalizedEmail !== user.email) {
        const emailOwner = await this.findByEmail(normalizedEmail);

        if (emailOwner && emailOwner.id !== user.id) {
          throw new ConflictException("Ya existe un usuario con ese correo.");
        }

        updatePayload.email = normalizedEmail;
        updatePayload.emailVerifiedAt = null;
      }
    }

    if (input.roles !== undefined) {
      updatePayload.roles = this.normalizeTagList(input.roles);
    }

    if (input.permissions !== undefined) {
      updatePayload.permissions = this.normalizeTagList(input.permissions);
    }

    if (input.status !== undefined) {
      if (actor.sub === user.id && input.status === "disabled") {
        throw new BadRequestException("No puedes inactivar tu propia cuenta.");
      }

      updatePayload.status = input.status;
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(user.id, updatePayload, { new: true }).exec();

    if (!updatedUser) {
      throw new NotFoundException("Usuario no encontrado.");
    }

    if (input.status && input.status !== "active") {
      await this.revokeAllRefreshTokensForUser(updatedUser.id, `user_status_${input.status}`);
    }

    this.audit("user.updated", {
      actorId: actor.sub,
      actorEmail: actor.email,
      userId: updatedUser.id,
      email: updatedUser.email
    });

    return {
      user: this.serializeUser(updatedUser),
      message: "Usuario actualizado correctamente."
    };
  }

  async inactivateUser(id: string, actor: AuthenticatedUser): Promise<UserMutationResponse> {
    this.assertCanManageUsers(actor);

    if (actor.sub === id) {
      throw new BadRequestException("No puedes inactivar tu propia cuenta.");
    }

    const user = await this.findManagedUserByIdOrThrow(id);
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        user.id,
        {
          status: "disabled",
          lockedUntil: null,
          failedLoginCount: 0
        },
        { new: true }
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException("Usuario no encontrado.");
    }

    await this.revokeAllRefreshTokensForUser(updatedUser.id, "user_inactivated");

    this.audit("user.inactivated", {
      actorId: actor.sub,
      actorEmail: actor.email,
      userId: updatedUser.id,
      email: updatedUser.email
    });

    return {
      user: this.serializeUser(updatedUser),
      message: "Usuario inactivado y sesiones revocadas."
    };
  }

  async sendCredentials(id: string, actor: AuthenticatedUser): Promise<UserMutationResponse> {
    this.assertCanManageUsers(actor);

    const user = await this.findManagedUserByIdOrThrow(id);

    if (user.status === "disabled") {
      throw new BadRequestException(
        "No puedes reenviar credenciales a un usuario inactivo. Reactivalo primero."
      );
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const now = new Date();

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        user.id,
        {
          passwordHash: await argon2.hash(temporaryPassword),
          passwordChangedAt: now,
          requirePasswordReset: true,
          failedLoginCount: 0,
          lockedUntil: null,
          lastCredentialIssuedAt: now,
          lastCredentialEmailSentAt: now
        },
        { new: true }
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException("Usuario no encontrado.");
    }

    await this.revokeAllRefreshTokensForUser(updatedUser.id, "credentials_reissued");
    const credentialDelivery = await this.sendCredentialsEmail(
      updatedUser,
      temporaryPassword,
      "Credenciales reenviadas correctamente."
    );

    if (credentialDelivery.status === "failed") {
      await this.userModel
        .findByIdAndUpdate(updatedUser.id, {
          lastCredentialEmailSentAt: null
        })
        .exec();
    }

    this.audit("user.credentials.sent", {
      actorId: actor.sub,
      actorEmail: actor.email,
      userId: updatedUser.id,
      email: updatedUser.email
    });

    return {
      user: this.serializeUser(updatedUser),
      message:
        credentialDelivery.status === "failed"
          ? "Se renovaron las credenciales, pero el correo fallo. Verifica la configuracion SMTP o reintenta."
          : "Credenciales renovadas correctamente.",
      credentialDelivery
    };
  }

  async validatePassword(user: PlatformUserDocument, password: string) {
    return argon2.verify(user.passwordHash, password);
  }

  async recordFailedLoginAttempt(
    userId: string,
    maxFailedAttempts: number,
    lockMinutes: number
  ) {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      return null;
    }

    const nextFailedCount = (user.failedLoginCount ?? 0) + 1;
    const lockedUntil =
      nextFailedCount >= maxFailedAttempts
        ? new Date(Date.now() + lockMinutes * 60 * 1000)
        : null;

    await this.userModel
      .findByIdAndUpdate(userId, {
        failedLoginCount: nextFailedCount,
        lockedUntil
      })
      .exec();

    return {
      failedLoginCount: nextFailedCount,
      lockedUntil
    };
  }

  async recordSuccessfulLogin(userId: string) {
    await this.userModel
      .findByIdAndUpdate(userId, {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      })
      .exec();
  }

  async updatePassword(userId: string, newPassword: string) {
    const passwordHash = await argon2.hash(newPassword);

    await this.userModel
      .findByIdAndUpdate(userId, {
        passwordHash,
        passwordChangedAt: new Date(),
        requirePasswordReset: false,
        failedLoginCount: 0,
        lockedUntil: null
      })
      .exec();
  }

  async revokeAllRefreshTokensForUser(userId: string, reason: string) {
    await this.refreshTokenModel
      .updateMany(
        {
          userId,
          revokedAt: null
        },
        {
          revokedAt: new Date(),
          revokedReason: reason
        }
      )
      .exec();
  }

  private async upsertDemoUser({
    email,
    fullName,
    roles,
    permissions,
    password
  }: {
    email: string;
    fullName: string;
    roles: string[];
    permissions: string[];
    password: string;
  }) {
    await this.userModel
      .updateOne(
        { email: email.toLowerCase() },
        {
          $setOnInsert: {
            email: email.toLowerCase(),
            fullName,
            status: "active",
            roles,
            permissions,
            passwordHash: await argon2.hash(password),
            emailVerifiedAt: new Date(),
            passwordChangedAt: new Date(),
            requirePasswordReset: false,
            failedLoginCount: 0,
            lockedUntil: null,
            lastCredentialIssuedAt: null,
            lastCredentialEmailSentAt: null
          }
        },
        {
          upsert: true
        }
      )
      .exec();
  }

  private assertCanManageUsers(actor: AuthenticatedUser) {
    const isPlatformAdmin = actor.roles.includes("platform_admin");
    const hasUserPermission = actor.permissions.some((permission) =>
      ["users.manage", "users.write", "users.create", "users.update"].includes(permission)
    );

    if (!isPlatformAdmin && !hasUserPermission) {
      throw new ForbiddenException("No tienes permisos para administrar usuarios.");
    }
  }

  private assertCanReadUsers(actor: AuthenticatedUser) {
    const isPlatformAdmin = actor.roles.includes("platform_admin");
    const hasUserReadPermission = actor.permissions.some((permission) =>
      ["users.manage", "users.write", "users.read"].includes(permission)
    );

    if (!isPlatformAdmin && !hasUserReadPermission) {
      throw new ForbiddenException("No tienes permisos para consultar usuarios.");
    }
  }

  private async findManagedUserByIdOrThrow(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Id de usuario invalido.");
    }

    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException("Usuario no encontrado.");
    }

    return user;
  }

  private normalizeTagList(values?: string[]) {
    return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
  }

  private serializeUser(user: PlatformUserDocument): PlatformUserView {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      roles: user.roles,
      permissions: user.permissions,
      requirePasswordReset: user.requirePasswordReset,
      failedLoginCount: user.failedLoginCount ?? 0,
      lockedUntil: user.lockedUntil,
      lastCredentialIssuedAt: user.lastCredentialIssuedAt ?? null,
      lastCredentialEmailSentAt: user.lastCredentialEmailSentAt ?? null,
      createdAt: "createdAt" in user ? ((user.createdAt as Date | undefined) ?? null) : null,
      updatedAt: "updatedAt" in user ? ((user.updatedAt as Date | undefined) ?? null) : null
    };
  }

  private generateTemporaryPassword() {
    const lower = "abcdefghjkmnpqrstuvwxyz";
    const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
    const numbers = "23456789";
    const symbols = "!@#$%&*+-_?";
    const all = `${lower}${upper}${numbers}${symbols}`;
    const characters = [
      lower[randomInt(lower.length)],
      upper[randomInt(upper.length)],
      numbers[randomInt(numbers.length)],
      symbols[randomInt(symbols.length)]
    ];

    while (characters.length < 16) {
      characters.push(all[randomInt(all.length)]);
    }

    for (let index = characters.length - 1; index > 0; index -= 1) {
      const targetIndex = randomInt(index + 1);
      [characters[index], characters[targetIndex]] = [characters[targetIndex], characters[index]];
    }

    return characters.join("");
  }

  private async sendCredentialsEmail(
    user: PlatformUserDocument,
    temporaryPassword: string,
    successMessage: string
  ): Promise<UserCredentialDelivery> {
    const mode = this.mailService.getTransportMode();

    try {
      await this.mailService.sendUserCredentialsEmail({
        to: user.email,
        fullName: user.fullName,
        email: user.email,
        temporaryPassword,
        loginUrl: `${this.configService.getOrThrow<string>("app.frontendBaseUrl")}/login`
      });

      return {
        status: mode === "smtp" ? "sent" : "logged",
        mode,
        message:
          mode === "smtp"
            ? successMessage
            : "Credenciales generadas en modo local. Revisa el log del backend para ver el correo."
      };
    } catch (error) {
      this.logger.error(
        `No fue posible enviar credenciales a ${user.email}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );

      return {
        status: "failed",
        mode,
        message: "El correo no pudo enviarse. Puedes reintentar desde administracion."
      };
    }
  }

  private audit(event: string, data: Record<string, unknown>) {
    this.logger.log(
      JSON.stringify({
        type: "user_admin_event",
        event,
        at: new Date().toISOString(),
        ...data
      })
    );
  }
}
