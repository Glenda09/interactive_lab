import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service.js";

@Injectable()
export class IamService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService
  ) {}

  async login(email: string, password: string) {
    const user = this.usersService.findByEmail(email);

    if (!user || !(await this.usersService.validatePassword(user, password))) {
      throw new UnauthorizedException("Credenciales invalidas.");
    }

    return this.issueTokens(user.id, user.email, user.roles, user.permissions);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow<string>("auth.refreshSecret")
      });

      return this.issueTokens(payload.sub, payload.email, payload.roles, payload.permissions);
    } catch {
      throw new UnauthorizedException("Refresh token invalido o expirado.");
    }
  }

  private async issueTokens(
    sub: string,
    email: string,
    roles: string[],
    permissions: string[]
  ) {
    const tokenPayload = { sub, email, roles, permissions };

    const accessToken = await this.jwtService.signAsync(tokenPayload);
    const refreshToken = await this.jwtService.signAsync(tokenPayload, {
      secret: this.configService.getOrThrow<string>("auth.refreshSecret"),
      expiresIn: this.configService.getOrThrow<`${number}${"s" | "m" | "h" | "d"}`>(
        "auth.refreshTtl"
      )
    });

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: this.configService.getOrThrow<string>("auth.accessTtl"),
      user: {
        id: sub,
        email,
        roles,
        permissions
      }
    };
  }
}
