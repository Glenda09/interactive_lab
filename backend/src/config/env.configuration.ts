export default () => ({
  app: {
    port: Number(process.env.PORT ?? 3000),
    corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(","),
    frontendBaseUrl: process.env.FRONTEND_BASE_URL ?? "http://localhost:5173"
  },
  database: {
    mongoUri:
      process.env.MONGO_URI ??
      "mongodb://admin:admin123@localhost:27017/interactive_lab?authSource=admin"
  },
  auth: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "local-access-secret-change-me",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "local-refresh-secret-change-me",
    accessTtl: (process.env.JWT_ACCESS_TTL ?? "900s") as `${number}${"s" | "m" | "h" | "d"}`,
    refreshTtl: (process.env.JWT_REFRESH_TTL ?? "7d") as `${number}${"s" | "m" | "h" | "d"}`,
    passwordResetTtlMinutes: Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 30),
    maxFailedLoginAttempts: Number(process.env.MAX_FAILED_LOGIN_ATTEMPTS ?? 5),
    accountLockMinutes: Number(process.env.ACCOUNT_LOCK_MINUTES ?? 15)
  },
  mail: {
    transport: process.env.MAIL_TRANSPORT ?? "json",
    from: process.env.MAIL_FROM ?? "Interactive Lab <no-reply@interactive-lab.local>",
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    apiKey: process.env.OLLAMA_API_KEY ?? "",
    model: process.env.OLLAMA_MODEL ?? "llava"
  },
  demoUsers: {
    admin: {
      email: process.env.DEMO_ADMIN_EMAIL ?? "admin@interactive-lab.local",
      password: process.env.DEMO_ADMIN_PASSWORD ?? "ChangeMe123!"
    },
    student: {
      email: process.env.DEMO_STUDENT_EMAIL ?? "student@interactive-lab.local",
      password: process.env.DEMO_STUDENT_PASSWORD ?? "ChangeMe123!"
    }
  }
});
