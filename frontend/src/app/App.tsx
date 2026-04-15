import { useEffect, useMemo, useState } from "react";
import { createBrowserRouter, NavLink, Outlet, RouterProvider, useLocation } from "react-router-dom";
import { RequireAuth, RequireGuest } from "../modules/auth/components/AuthGuards";
import { logoutRequest } from "../modules/auth/lib/auth-api";
import { ChangePasswordPage } from "../modules/auth/pages/ChangePasswordPage";
import { ForgotPasswordPage } from "../modules/auth/pages/ForgotPasswordPage";
import { LoginPage } from "../modules/auth/pages/LoginPage";
import { ResetPasswordPage } from "../modules/auth/pages/ResetPasswordPage";
import { useAuthStore } from "../modules/auth/state/useAuthStore";
import { AdminSectionPage } from "../modules/dashboard/pages/AdminSectionPage";
import { DashboardPage } from "../modules/dashboard/pages/DashboardPage";
import { UserManagementPage } from "../modules/users/pages/UserManagementPage";
import { SimulationPage } from "../simulation/pages/SimulationPage";
import { RouteErrorPage } from "./RouteErrorPage";

function DashboardIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <rect height="6" rx="2" width="6" x="2" y="2" />
      <rect height="6" rx="2" width="8" x="10" y="2" />
      <rect height="8" rx="2" width="6" x="2" y="10" />
      <rect height="8" rx="2" width="8" x="10" y="10" />
    </svg>
  );
}

function SimulationIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M10 2 17 6v8l-7 4-7-4V6Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 6l7 4 7-4M10 10v8" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function CoursesIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 4.5h12v11H4z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 2.8v3.4M13 2.8v3.4M7 9.5h6M7 13h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function PathsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <circle cx="5" cy="5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="15" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="8" cy="15" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6.8 6.3 13 8.8M13.2 11.8 9.8 13.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function ResourcesIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M5 4.5h7.5L15 7v8.5H5z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M12.5 4.5V7H15M7.3 10h5.4M7.3 13h5.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function AssessmentsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M5 4.5h10v11H5z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="m7.2 9.8 1.4 1.4 3.3-3.3M7.3 13.5h5.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <circle cx="7" cy="7" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="13.8" cy="8" r="1.9" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.8 15.5c.5-2.1 2-3.5 4.2-3.5s3.8 1.4 4.3 3.5M12.2 15.3c.3-1.5 1.3-2.5 2.9-2.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M5 15.5V9.8M10 15.5V5.8M15 15.5v-3.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
      <path d="M3.5 15.5h13" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <circle cx="9" cy="9" fill="none" r="5.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m13.2 13.2 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 5.5h12M4 10h12M4 14.5h12" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M10 2.5v7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path
        d="M6 4.8a7 7 0 1 0 8 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="3.3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M10 1.8v2.4M10 15.8v2.4M18.2 10h-2.4M4.2 10H1.8M15.8 4.2l-1.7 1.7M5.9 14.1l-1.7 1.7M15.8 15.8l-1.7-1.7M5.9 5.9 4.2 4.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="M14.7 13.9A6.7 6.7 0 0 1 6.1 5.3a6.8 6.8 0 1 0 8.6 8.6Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

const adminSectionPages = {
  courses: (
    <AdminSectionPage
      eyebrow="Catalogo academico"
      title="Gestiona la oferta de cursos y su ciclo de publicacion"
      description="Administra catalogo, versionado, responsables, duracion y estado de salida para cada curso formativo."
      highlights={[
        { label: "Publicacion", detail: "Controlar borradores, aprobaciones y disponibilidad por cohorte." },
        { label: "Versionado", detail: "Mantener historial de cambios por modulo, objetivos y evidencias." },
        { label: "Asignacion", detail: "Vincular cursos a instructores, grupos y rutas de aprendizaje." }
      ]}
    />
  ),
  learningPaths: (
    <AdminSectionPage
      eyebrow="Planeacion formativa"
      title="Orquesta rutas de aprendizaje por perfil y nivel operativo"
      description="Configura trayectorias academicas con prerrequisitos, secuencias y cumplimiento por rol."
      highlights={[
        { label: "Secuencias", detail: "Definir orden, dependencias y hitos de avance por ruta." },
        { label: "Perfiles", detail: "Asignar rutas distintas para estudiantes, tecnicos y supervisores." },
        { label: "Cobertura", detail: "Mapear cursos y simulaciones a competencias observables." }
      ]}
    />
  ),
  resources: (
    <AdminSectionPage
      eyebrow="Biblioteca operativa"
      title="Centraliza recursos, manuales y materiales de soporte"
      description="Organiza documentos, videos, anexos y ayudas visuales que respaldan el entrenamiento tecnico."
      highlights={[
        { label: "Repositorio", detail: "Clasificar manuales, SOP, fichas tecnicas y evidencia multimedia." },
        { label: "Acceso", detail: "Controlar visibilidad por rol, curso y contexto de uso." },
        { label: "Versiones", detail: "Conservar trazabilidad documental y fechas de vigencia." }
      ]}
    />
  ),
  assessments: (
    <AdminSectionPage
      eyebrow="Validacion academica"
      title="Configura evaluaciones teoricas, practicas y criterios de aprobacion"
      description="Prepara instrumentos de medicion alineados con objetivos, simulaciones y evidencia de desempeno."
      highlights={[
        { label: "Rubricas", detail: "Definir criterios de calificacion y umbrales de aprobacion." },
        { label: "Intentos", detail: "Regular oportunidades, tiempos y retroalimentacion por evaluacion." },
        { label: "Evidencia", detail: "Relacionar resultados con actividades, modulos y eventos de simulacion." }
      ]}
    />
  ),
  users: (
    <AdminSectionPage
      eyebrow="Acceso y talento"
      title="Administra usuarios, roles y permisos del ecosistema formativo"
      description="Supervisa altas, perfiles, asignaciones y controles de seguridad para toda la plataforma."
      highlights={[
        { label: "Roles", detail: "Gestionar privilegios para admins, instructores, estudiantes y supervisores." },
        { label: "Cohortes", detail: "Asignar usuarios a grupos, sedes y calendarios de entrenamiento." },
        { label: "Seguridad", detail: "Aplicar politicas de acceso, recuperacion y endurecimiento de sesiones." }
      ]}
    />
  ),
  reports: (
    <AdminSectionPage
      eyebrow="Analitica y seguimiento"
      title="Consolida reportes de avance, cumplimiento y desempeno"
      description="Prepara lectura operativa para auditoria, supervision academica y toma de decisiones."
      highlights={[
        { label: "Cumplimiento", detail: "Revisar avance por cohorte, rol y ruta formativa." },
        { label: "Desempeno", detail: "Cruzar notas, simulaciones y progreso por modulo." },
        { label: "Exportacion", detail: "Preparar salidas para comites, auditorias y revisiones internas." }
      ]}
    />
  )
} as const;

const primaryNavigationItems = [
  {
    path: "/",
    label: "Dashboard",
    title: "Dashboard",
    subtitle: "Supervisa acceso, catalogo y operacion academica desde una consola administrativa.",
    icon: DashboardIcon
  },
  {
    path: "/courses",
    label: "Cursos",
    title: "Cursos",
    subtitle: "Gestiona catalogo, modulos, duracion y publicacion de la oferta academica.",
    icon: CoursesIcon
  },
  {
    path: "/learning-paths",
    label: "Rutas",
    title: "Rutas formativas",
    subtitle: "Organiza itinerarios, secuencias y prerrequisitos del entrenamiento.",
    icon: PathsIcon
  },
  {
    path: "/resources",
    label: "Recursos",
    title: "Recursos",
    subtitle: "Administra materiales, manuales, anexos y ayudas del ecosistema de capacitacion.",
    icon: ResourcesIcon
  },
  {
    path: "/assessments",
    label: "Evaluaciones",
    title: "Evaluaciones",
    subtitle: "Configura instrumentos, criterios y evidencia de aprobacion.",
    icon: AssessmentsIcon
  },
  {
    path: "/users",
    label: "Usuarios",
    title: "Usuarios",
    subtitle: "Administra accesos, credenciales y estados de cuenta del sistema.",
    icon: UsersIcon
  },
  {
    path: "/reports",
    label: "Reportes",
    title: "Reportes",
    subtitle: "Consulta avance, cumplimiento y desempeno del sistema de formacion.",
    icon: ReportsIcon
  },
  {
    path: "/simulation",
    label: "Simulacion 3D",
    title: "Simulacion 3D",
    subtitle: "Opera, prueba escenarios y revisa eventos del runtime inmersivo.",
    icon: SimulationIcon
  }
] as const;

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <RequireGuest />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "forgot-password", element: <ForgotPasswordPage /> },
          { path: "reset-password", element: <ResetPasswordPage /> }
        ]
      },
      {
        element: <RequireAuth />,
        children: [
          { path: "change-password", element: <ChangePasswordPage /> },
          {
            element: <RootLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: "courses", element: adminSectionPages.courses },
              { path: "learning-paths", element: adminSectionPages.learningPaths },
              { path: "resources", element: adminSectionPages.resources },
              { path: "assessments", element: adminSectionPages.assessments },
              { path: "users", element: <UserManagementPage /> },
              { path: "reports", element: adminSectionPages.reports },
              { path: "simulation", element: <SimulationPage /> }
            ]
          }
        ]
      }
    ]
  }
]);

function RootLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const storedTheme = window.localStorage.getItem("interactive-lab-theme");
    return storedTheme === "dark" ? "dark" : "light";
  });
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearSession = useAuthStore((state) => state.clearSession);

  const pageMeta = useMemo(
    () =>
      primaryNavigationItems.find((item) => item.path === location.pathname) ?? primaryNavigationItems[0],
    [location.pathname]
  );

  async function handleLogout() {
    if (refreshToken) {
      await logoutRequest({ refreshToken }).catch(() => undefined);
    }

    clearSession();
  }

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem("interactive-lab-theme", themeMode);
  }, [themeMode]);

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? "I";

  return (
    <div className="workspace-frame">
      <div className={`app-shell ${isSidebarCollapsed ? "is-collapsed" : ""}`}>
        <aside className="sidebar">
          <div className="sidebar-top">
            <button
              aria-label={isSidebarCollapsed ? "Expandir menu lateral" : "Encoger menu lateral"}
              className="sidebar-toggle"
              onClick={() => setIsSidebarCollapsed((value) => !value)}
              type="button"
            >
              <MenuIcon />
            </button>
          </div>

          <div className="sidebar-body">
            <div className="sidebar-nav-group">
              {!isSidebarCollapsed && <p className="sidebar-section-label">Menu</p>}
              <nav className="nav-links" aria-label="Primary navigation">
                {primaryNavigationItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      aria-label={item.label}
                      title={item.label}
                      to={item.path}
                      end={item.path === "/"}
                    >
                      <span className="nav-link-icon">
                        <Icon />
                      </span>
                      {!isSidebarCollapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        <main className="workspace-main">
          <header className="workspace-topbar">
            <div className="workspace-search">
              <SearchIcon />
              <input placeholder="Buscar modulo, curso o ruta" type="text" />
            </div>

            <div className="workspace-actions">
              <div className="theme-toggle" role="group" aria-label="Seleccion de tema">
                <button
                  className={`theme-toggle-button ${themeMode === "light" ? "is-active" : ""}`}
                  onClick={() => setThemeMode("light")}
                  type="button"
                >
                  <SunIcon />
                  <span>Claro</span>
                </button>
                <button
                  className={`theme-toggle-button ${themeMode === "dark" ? "is-active" : ""}`}
                  onClick={() => setThemeMode("dark")}
                  type="button"
                >
                  <MoonIcon />
                  <span>Oscuro</span>
                </button>
              </div>

              <button className="topbar-logout" onClick={() => void handleLogout()} type="button">
                <PowerIcon />
              </button>

              <div className="topbar-user-card">
                <div className="topbar-user-avatar">{userInitial}</div>
                <div className="topbar-user-copy">
                  <strong>{user?.email ?? "Usuario activo"}</strong>
                  <span>{user?.roles.join(", ") ?? "Sin roles asociados"}</span>
                </div>
              </div>
            </div>
          </header>

          <section className="workspace-content">
            <header className="workspace-page-header">
              <div>
                <h1>{pageMeta.title}</h1>
                <p>{pageMeta.subtitle}</p>
              </div>
            </header>

            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return <RouterProvider router={router} />;
}
