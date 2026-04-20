import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard.js";

const ROLES_CATALOG = [
  {
    name: "platform_admin",
    label: "Administrador de plataforma",
    description: "Acceso total a administración, usuarios, cursos y configuración.",
    defaultPermissions: ["users.manage", "courses.manage", "scenarios.manage", "enrollments.manage", "audit.read"]
  },
  {
    name: "instructor",
    label: "Instructor / Facilitador",
    description: "Puede crear y editar cursos, escenarios y ver progreso de estudiantes.",
    defaultPermissions: ["courses.write", "scenarios.write", "enrollments.read", "progress.read"]
  },
  {
    name: "student",
    label: "Estudiante",
    description: "Acceso al área académica: cursos, simulaciones y seguimiento de progreso.",
    defaultPermissions: ["progress.read.self", "simulations.launch"]
  },
  {
    name: "supervisor",
    label: "Supervisor",
    description: "Puede visualizar reportes y progreso del equipo sin modificar contenido.",
    defaultPermissions: ["progress.read", "enrollments.read", "users.read", "audit.read"]
  }
];

const PERMISSIONS_CATALOG = [
  { name: "users.manage", label: "Gestión completa de usuarios", category: "Usuarios" },
  { name: "users.read", label: "Ver usuarios", category: "Usuarios" },
  { name: "users.write", label: "Crear y editar usuarios", category: "Usuarios" },
  { name: "courses.manage", label: "Gestión completa de cursos", category: "Cursos" },
  { name: "courses.write", label: "Crear y editar cursos", category: "Cursos" },
  { name: "courses.read", label: "Ver catálogo de cursos", category: "Cursos" },
  { name: "scenarios.manage", label: "Gestión completa de escenarios 3D", category: "Escenarios" },
  { name: "scenarios.publish", label: "Publicar escenarios", category: "Escenarios" },
  { name: "scenarios.write", label: "Crear y editar escenarios", category: "Escenarios" },
  { name: "enrollments.manage", label: "Gestión completa de inscripciones", category: "Inscripciones" },
  { name: "enrollments.read", label: "Ver inscripciones", category: "Inscripciones" },
  { name: "enrollments.write", label: "Crear y editar inscripciones", category: "Inscripciones" },
  { name: "progress.read", label: "Ver progreso de todos los usuarios", category: "Progreso" },
  { name: "progress.read.self", label: "Ver mi propio progreso", category: "Progreso" },
  { name: "simulations.launch", label: "Lanzar simulaciones 3D", category: "Simulaciones" },
  { name: "audit.read", label: "Ver registros de auditoría", category: "Auditoría" }
];

@ApiTags("catalog")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("catalog")
export class RolesController {
  @Get("roles")
  @ApiOkResponse({ description: "Catálogo de roles disponibles." })
  getRoles() {
    return ROLES_CATALOG;
  }

  @Get("permissions")
  @ApiOkResponse({ description: "Catálogo de permisos disponibles." })
  getPermissions() {
    return PERMISSIONS_CATALOG;
  }
}
