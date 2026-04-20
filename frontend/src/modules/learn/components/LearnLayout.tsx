import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logoutRequest } from "../../auth/lib/auth-api";
import { useAuthStore } from "../../auth/state/useAuthStore";

function HomeIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M3 9l7-6 7 6v9H12v-5H8v5H3V9z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
}
function BookIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 4.5h12v11H4z" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M7 2.8v3.4M13 2.8v3.4M7 9.5h6M7 13h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}
function GridIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><rect height="6" rx="2" width="6" x="2" y="2" /><rect height="6" rx="2" width="8" x="10" y="2" /><rect height="8" rx="2" width="6" x="2" y="10" /><rect height="8" rx="2" width="8" x="10" y="10" /></svg>;
}
function UserIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="7" fill="none" r="3.5" stroke="currentColor" strokeWidth="1.7" /><path d="M3 18c0-3.87 3.13-7 7-7s7 3.13 7 7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}
function LogoutIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M7 4H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M13 14l4-4-4-4M17 10H7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
}
function MenuIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}
function ShieldIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M10 2l7 3v5c0 4-3.5 7-7 8-3.5-1-7-4-7-8V5l7-3z" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>;
}

export function LearnLayout() {
  const user = useAuthStore(s => s.user);
  const clearAuth = useAuthStore(s => s.clearSession);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.roles.includes("platform_admin") || user?.roles.includes("instructor");

  const refreshToken = useAuthStore(s => s.refreshToken);

  async function handleLogout() {
    if (refreshToken) {
      try { await logoutRequest({ refreshToken }); } catch { /* ignore */ }
    }
    clearAuth();
    void navigate("/login");
  }

  const navLinks = [
    { to: "/learn", label: "Mi aprendizaje", icon: <HomeIcon />, end: true },
    { to: "/learn/catalog", label: "Catálogo de cursos", icon: <GridIcon /> },
    { to: "/learn/my-courses", label: "Mis cursos", icon: <BookIcon /> },
    { to: "/learn/profile", label: "Mi perfil", icon: <UserIcon /> }
  ];

  return (
    <div className="workspace-frame learn-workspace">
      <div className={`app-shell learn-shell ${collapsed ? "is-collapsed" : ""}`}>
        <nav className="sidebar learn-sidebar">
          <div className="sidebar-top">
            <div className="learn-brand">
              <div className="learn-brand-icon">
                <svg viewBox="0 0 32 32" aria-hidden="true">
                  <polygon fill="var(--brand-accent)" points="16,4 28,10 28,22 16,28 4,22 4,10" opacity="0.9" />
                  <polygon fill="white" opacity="0.25" points="16,4 28,10 16,16" />
                  <circle cx="16" cy="16" fill="white" r="4" opacity="0.9" />
                </svg>
              </div>
              {!collapsed && (
                <div>
                  <div className="learn-brand-name">SimuLearn</div>
                  <div className="learn-brand-sub">Capacitación 3D</div>
                </div>
              )}
            </div>
            <button className="sidebar-toggle" onClick={() => setCollapsed(v => !v)} type="button" aria-label="Colapsar menú">
              <MenuIcon />
            </button>
          </div>

          <div className="sidebar-body">
            {!collapsed && <p className="eyebrow" style={{ marginBottom: 4 }}>Área académica</p>}
            <div className="sidebar-nav-group">
              <ul className="nav-links">
                {navLinks.map(link => (
                  <li key={link.to}>
                    <NavLink to={link.to} end={link.end} className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
                      <span className="nav-link-icon">{link.icon}</span>
                      {!collapsed && <span>{link.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {isAdmin && (
              <div className="sidebar-nav-group" style={{ marginTop: "auto" }}>
                {!collapsed && <p className="eyebrow" style={{ marginBottom: 4 }}>Administración</p>}
                <ul className="nav-links">
                  <li>
                    <NavLink to="/admin" className="nav-link admin-nav-link">
                      <span className="nav-link-icon"><ShieldIcon /></span>
                      {!collapsed && <span>Panel admin</span>}
                    </NavLink>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="sidebar-footer">
            {!collapsed && user && (
              <div className="sidebar-user-info">
                <div className="user-avatar">{user.email.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="sidebar-user-name">{user.email.split("@")[0]}</div>
                  <div className="sidebar-user-role">{user.roles[0] ?? "Estudiante"}</div>
                </div>
              </div>
            )}
            <button className="topbar-logout" onClick={handleLogout} title="Cerrar sesión" type="button">
              <LogoutIcon />
              {!collapsed && <span>Salir</span>}
            </button>
          </div>
        </nav>

        <main className="workspace-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
