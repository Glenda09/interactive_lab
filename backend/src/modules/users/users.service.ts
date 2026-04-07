import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";

export interface PlatformUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  passwordHash: string;
}

@Injectable()
export class UsersService implements OnModuleInit {
  private users: PlatformUser[] = [];

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const adminPassword = this.configService.getOrThrow<string>("demoUsers.admin.password");
    const studentPassword = this.configService.getOrThrow<string>("demoUsers.student.password");

    this.users = [
      {
        id: "usr_admin_001",
        email: this.configService.getOrThrow<string>("demoUsers.admin.email"),
        fullName: "Platform Admin",
        roles: ["platform_admin"],
        permissions: ["users.read", "courses.create", "scenarios.publish", "audit.read"],
        passwordHash: await argon2.hash(adminPassword)
      },
      {
        id: "usr_student_001",
        email: this.configService.getOrThrow<string>("demoUsers.student.email"),
        fullName: "Demo Student",
        roles: ["student"],
        permissions: ["progress.read.self", "simulations.launch"],
        passwordHash: await argon2.hash(studentPassword)
      }
    ];
  }

  findAll() {
    return this.users.map(({ passwordHash, ...user }) => user);
  }

  findById(id: string) {
    return this.users.find((user) => user.id === id);
  }

  findByEmail(email: string) {
    return this.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  async validatePassword(user: PlatformUser, password: string) {
    return argon2.verify(user.passwordHash, password);
  }
}

