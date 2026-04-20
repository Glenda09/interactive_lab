import { useEffect, useMemo, useState } from "react";
import { createBrowserRouter, NavLink, Navigate, Outlet, RouterProvider, useLocation } from "react-router-dom";
import { RequireAuth, RequireGuest } from "../modules/auth/components/AuthGuards";
import { logoutRequest } from "../modules/auth/lib/auth-api";
import { ChangePasswordPage } from "../modules/auth/pages/ChangePasswordPage";
import { ForgotPasswordPage } from "../modules/auth/pages/ForgotPasswordPage";
import { LoginPage } from "../modules/auth/pages/LoginPage";
import { ResetPasswordPage } from "../modules/auth/pages/ResetPasswordPage";
import { useAuthStore } from "../modules/auth/state/useAuthStore";
import { DashboardPage } from "../modules/dashboard/pages/DashboardPage";
import { ReportsPage } from "../modules/dashboard/pages/ReportsPage";
import { CourseManagementPage } from "../modules/courses/pages/CourseManagementPage";
import { ScenarioManagementPage } from "../modules/scenarios/pages/ScenarioManagementPage";
import { EnrollmentManagementPage } from "../modules/enrollments/pages/EnrollmentManagementPage";
import { UserManagementPage } from "../modules/users/pages/UserManagementPage";
import { LearnLayout } from "../modules/learn/components/LearnLayout";
import { LearnDashboardPage } from "../modules/learn/pages/LearnDashboardPage";
import { CourseCatalogPage } from "../modules/learn/pages/CourseCatalogPage";
import { MyCoursesPage } from "../modules/learn/pages/MyCoursesPage";
import { CourseDetailPage } from "../modules/learn/pages/CourseDetailPage";
import { StudentProfilePage } from "../modules/learn/pages/StudentProfilePage";
import { SimulationPage } from "../simulation/pages/SimulationPage";
import { RouteErrorPage } from "./RouteErrorPage";

// ─── Icons ───────────────────────────────────────────────────────────────────

function DashboardIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><rect height="6" rx="2" width="6" x="2" y="2" /><rect height="6" rx="2" width="8" x="10" y="2" /><rect height="8" rx="2" width="6" x="2" y="10" /><rect height="8" rx="2" width="8" x="10" y="10" /></svg>;
}
function CoursesIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 4.5h12v11H4z" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M7 2.8v3.4M13 2.8v3.4M7 9.5h6M7 13h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}
function SimulationIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M10 2 17 6v8l-7 4-7-4V6Z" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M3 6l7 4 7-4M10 10v8" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>;
}
function UsersIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="7" cy="7" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.7" /><circle cx="13.8" cy="8" r="1.9" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M3.8 15.5c.5-2.1 2-3.5 4.2-3.5s3.8 1.4 4.3 3.5M12.2 15.3c.3-1.5 1.3-2.5 2.9-2.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}
function ReportsIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M5 15.5V9.8M10 15.5V5.8M15 15.5v-3.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" /><path d="M3.5 15.5h13" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}
function EnrollIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M9 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-4" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M13 2l4 4-7 7H6v-4l7-7z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
}
function ScenariosIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M10 2 17 6v8l-7 4-7-4V6Z" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M3 6l7 4 7-4M10 10v8" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>;
}
function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="9" cy="9" fill="none" r="5.5" stroke="currentColor" strokeWidth="1.7" /><path d="m13.2 13.2 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}
function MenuIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 5.5h12M4 10h12M4 14.5h12" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>;
}
function PowerIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M10 2.5v7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><path d="M6 4.8a7 7 0 1 0 8 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>;
}
function LearnIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M10 3L2 7l8 4 8-4-8-4z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /><path d="M2 7v6M18 7v6M10 11v6M5 9.5v4.5M15 9.5v4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}
function SunIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.3" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M10 1.8v2.4M10 15.8v2.4M18.2 10h-2.4M4.2 10H1.8M15.8 4.2l-1.7 1.7M5.9 14.1l-1.7 1.7M15.8 15.8l-1.7-1.7M5.9 5.9 4.2 4.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}
function MoonIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M14.7 13.9A6.7 6.7 0 0 1 6.1 5.3a6.8 6.8 0 1 0 8.6 8.6Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
}

// ─── Admin navigation ─────────────────────────────────────────────────────────

const adminNavItems = [
  { path: "/admin", label: "Dashboard", icon: DashboardIcon, end: true },
  { path: "/admin/courses", label: "Cursos", icon: CoursesIcon },
  { path: "/admin/scenarios", label: "Escenarios 3D", icon: ScenariosIcon },
  { path: "/admin/enrollments", label: "Inscripciones", icon: EnrollIcon },
  { path: "/admin/users", label: "Usuarios", icon: UsersIcon },
  { path: "/admin/reports", label: "Reportes", icon: ReportsIcon },
  { path: "/admin/simulation", label: "Simulación", icon: SimulationIcon }
] as const;

// ─── Admin Layout ─────────────────────────────────────────────────────────────

function AdminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">(() => {
    const stored = window.localStorage.getItem("interactive-lab-theme");
    return stored === "dark" ? "dark" : "light";
  });
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearSession = useAuthStore((state) => state.clearSession);

  const pageMeta = useMemo(
    () => adminNavItems.find(item => location.pathname === item.path || (!(item as { end?: boolean }).end && location.pathname.startsWith(item.path))) ?? adminNavItems[0],
    [location.pathname]
  );

  async function handleLogout() {
    if (refreshToken) await logoutRequest({ refreshToken }).catch(() => undefined);
    clearSession();
  }

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem("interactive-lab-theme", themeMode);
  }, [themeMode]);

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? "A";

  return (
    <div className="workspace-frame">
      <div className={`app-shell ${isSidebarCollapsed ? "is-collapsed" : ""}`}>
        <aside className="sidebar">
          <div className="sidebar-top">
            <div className="admin-brand">
              <svg viewBox="0 0 32 32" aria-hidden="true" width="32" height="32">
                <polygon fill="var(--brand-accent)" points="16,3 29,10 29,22 16,29 3,22 3,10" opacity="0.9" />
                <polygon fill="white" opacity="0.2" points="16,3 29,10 16,16" />
                <circle cx="16" cy="16" fill="white" r="5" opacity="0.9" />
              </svg>
              {!isSidebarCollapsed && (
                <div>
                  <div className="admin-brand-name">SimuLearn</div>
                  <div className="admin-brand-role">Admin</div>
                </div>
              )}
            </div>
            <button
              aria-label={isSidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
              className="sidebar-toggle"
              onClick={() => setIsSidebarCollapsed(v => !v)}
              type="button"
            >
              <MenuIcon />
            </button>
          </div>

          <div className="sidebar-body">
            <div className="sidebar-nav-group">
              {!isSidebarCollapsed && <p className="sidebar-section-label">Administración</p>}
              <nav className="nav-links" aria-label="Admin navigation">
                {adminNavItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink key={item.path} to={item.path} end={(item as { end?: boolean }).end === true} aria-label={item.label} title={item.label}>
                      <span className="nav-link-icon"><Icon /></span>
                      {!isSidebarCollapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="sidebar-nav-group" style={{ marginTop: "auto" }}>
              {!isSidebarCollapsed && <p className="sidebar-section-label">Área académica</p>}
              <nav className="nav-links">
                <NavLink to="/learn" aria-label="Ir al área de estudiantes" title="Área de estudiantes">
                  <span className="nav-link-icon"><LearnIcon /></span>
                  {!isSidebarCollapsed && <span>Área estudiante</span>}
                </NavLink>
              </nav>
            </div>
          </div>
        </aside>

        <main className="workspace-main">
          <header className="workspace-topbar">
            <div className="workspace-search">
              <SearchIcon />
              <input placeholder="Buscar módulo, curso o usuario..." type="text" />
            </div>
            <div className="workspace-actions">
              <div className="theme-toggle" role="group" aria-label="Selección de tema">
                <button className={`theme-toggle-button ${themeMode === "light" ? "is-active" : ""}`} onClick={() => setThemeMode("light")} type="button">
                  <SunIcon /><span>Claro</span>
                </button>
                <button className={`theme-toggle-button ${themeMode === "dark" ? "is-active" : ""}`} onClick={() => setThemeMode("dark")} type="button">
                  <MoonIcon /><span>Oscuro</span>
                </button>
              </div>
              <button className="topbar-logout" onClick={() => void handleLogout()} type="button">
                <PowerIcon />
              </button>
              <div className="topbar-user-card">
                <div className="topbar-user-avatar">{userInitial}</div>
                <div className="topbar-user-copy">
                  <strong>{user?.email ?? "Admin"}</strong>
                  <span>{user?.roles.join(", ") ?? "Sin roles"}</span>
                </div>
              </div>
            </div>
          </header>

          <section className="workspace-content">
            <header className="workspace-page-header">
              <div>
                <h1>{pageMeta.label}</h1>
              </div>
            </header>
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

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
          // Admin area
          {
            path: "admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: "courses", element: <CourseManagementPage /> },
              { path: "scenarios", element: <ScenarioManagementPage /> },
              { path: "enrollments", element: <EnrollmentManagementPage /> },
              { path: "users", element: <UserManagementPage /> },
              { path: "reports", element: <ReportsPage /> },
              { path: "simulation", element: <SimulationPage /> }
            ]
          },
          // Student / Learn area
          {
            path: "learn",
            element: <LearnLayout />,
            children: [
              { index: true, element: <LearnDashboardPage /> },
              { path: "catalog", element: <CourseCatalogPage /> },
              { path: "my-courses", element: <MyCoursesPage /> },
              { path: "courses/:courseId", element: <CourseDetailPage /> },
              { path: "profile", element: <StudentProfilePage /> }
            ]
          },
          // Simulation (standalone, can be accessed from modules)
          { path: "simulation", element: <SimulationPage /> },
          // Root redirect: admins → /admin, students → /learn
          { index: true, element: <RootRedirect /> }
        ]
      }
    ]
  }
]);

function RootRedirect() {
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.roles.includes("platform_admin") || user?.roles.includes("instructor") || user?.roles.includes("supervisor");
  return <Navigate to={isAdmin ? "/admin" : "/learn"} replace />;
}

export function App() {
  return <RouterProvider router={router} />;
}
