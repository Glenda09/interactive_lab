export default () => ({
  app: {
    port: Number(process.env.PORT ?? 3000),
    corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(",")
  },
  auth: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "local-access-secret-change-me",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "local-refresh-secret-change-me",
    accessTtl: (process.env.JWT_ACCESS_TTL ?? "900s") as `${number}${"s" | "m" | "h" | "d"}`,
    refreshTtl: (process.env.JWT_REFRESH_TTL ?? "7d") as `${number}${"s" | "m" | "h" | "d"}`
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
