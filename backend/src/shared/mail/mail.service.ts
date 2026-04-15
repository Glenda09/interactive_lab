import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { Transporter } from "nodemailer";

interface PasswordResetMailPayload {
  to: string;
  fullName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

interface UserCredentialsMailPayload {
  to: string;
  fullName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly transportMode: string;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.transportMode = this.configService.get<string>("mail.transport") ?? "json";

    this.transporter =
      this.transportMode === "smtp"
        ? nodemailer.createTransport({
            host: this.configService.get<string>("mail.host"),
            port: this.configService.get<number>("mail.port"),
            secure: this.configService.get<boolean>("mail.secure"),
            auth:
              this.configService.get<string>("mail.user") &&
              this.configService.get<string>("mail.pass")
                ? {
                    user: this.configService.get<string>("mail.user"),
                    pass: this.configService.get<string>("mail.pass")
                  }
                : undefined
          })
        : nodemailer.createTransport({ jsonTransport: true });
  }

  async sendPasswordResetEmail(payload: PasswordResetMailPayload) {
    const info = await this.transporter.sendMail({
      from: this.configService.getOrThrow<string>("mail.from"),
      to: payload.to,
      subject: "Recupera el acceso a Interactive Lab",
      text: [
        `Hola ${payload.fullName},`,
        "",
        "Recibimos una solicitud para restablecer tu contrasena.",
        `Usa este enlace dentro de los proximos ${payload.expiresInMinutes} minutos:`,
        payload.resetUrl,
        "",
        "Si no realizaste esta solicitud, puedes ignorar este mensaje."
      ].join("\n"),
      html: [
        `<p>Hola ${payload.fullName},</p>`,
        "<p>Recibimos una solicitud para restablecer tu contrasena.</p>",
        `<p>Usa este enlace dentro de los proximos ${payload.expiresInMinutes} minutos:</p>`,
        `<p><a href=\"${payload.resetUrl}\">${payload.resetUrl}</a></p>`,
        "<p>Si no realizaste esta solicitud, puedes ignorar este mensaje.</p>"
      ].join("")
    });

    if (this.transportMode !== "smtp") {
      const preview =
        typeof info.message === "string" ? info.message : info.message.toString("utf8");
      this.logger.log(`Correo de recuperacion generado en modo ${this.transportMode}: ${preview}`);
    }

    return info;
  }

  async sendUserCredentialsEmail(payload: UserCredentialsMailPayload) {
    const info = await this.transporter.sendMail({
      from: this.configService.getOrThrow<string>("mail.from"),
      to: payload.to,
      subject: "Tus credenciales de acceso a Interactive Lab",
      text: [
        `Hola ${payload.fullName},`,
        "",
        "Se creo una cuenta para ti en Interactive Lab.",
        `Usuario: ${payload.email}`,
        `Contrasena temporal: ${payload.temporaryPassword}`,
        `Acceso: ${payload.loginUrl}`,
        "",
        "Por seguridad, deberas cambiar la contrasena al iniciar sesion por primera vez."
      ].join("\n"),
      html: [
        `<p>Hola ${payload.fullName},</p>`,
        "<p>Se creo una cuenta para ti en Interactive Lab.</p>",
        `<p><strong>Usuario:</strong> ${payload.email}</p>`,
        `<p><strong>Contrasena temporal:</strong> ${payload.temporaryPassword}</p>`,
        `<p><strong>Acceso:</strong> <a href=\"${payload.loginUrl}\">${payload.loginUrl}</a></p>`,
        "<p>Por seguridad, deberas cambiar la contrasena al iniciar sesion por primera vez.</p>"
      ].join("")
    });

    if (this.transportMode !== "smtp") {
      const preview =
        typeof info.message === "string" ? info.message : info.message.toString("utf8");
      this.logger.log(
        `Correo de credenciales generado en modo ${this.transportMode}: ${preview}`
      );
    }

    return info;
  }

  getTransportMode() {
    return this.transportMode;
  }
}
