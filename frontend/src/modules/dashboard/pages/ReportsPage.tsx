import { useQuery } from "@tanstack/react-query";
import {
  getCourses,
  getEnrollments,
  getScenarios,
  getUsers
} from "../../../shared/lib/api/platform";

export function ReportsPage() {
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: getUsers });
  const coursesQuery = useQuery({ queryKey: ["courses"], queryFn: () => getCourses() });
  const enrollmentsQuery = useQuery({ queryKey: ["enrollments"], queryFn: () => getEnrollments() });
  const scenariosQuery = useQuery({ queryKey: ["scenarios"], queryFn: () => getScenarios() });

  const users = usersQuery.data ?? [];
  const courses = coursesQuery.data ?? [];
  const enrollments = enrollmentsQuery.data ?? [];
  const scenarios = scenariosQuery.data ?? [];

  const activeEnrollments = enrollments.filter(e => e.status === "active").length;
  const completedEnrollments = enrollments.filter(e => e.status === "completed").length;
  const completionRate = enrollments.length > 0
    ? Math.round((completedEnrollments / enrollments.length) * 100)
    : 0;

  const courseEnrollmentCounts = courses.map(c => ({
    ...c,
    enrollments: enrollments.filter(e => e.courseId === c.id).length,
    completions: enrollments.filter(e => e.courseId === c.id && e.status === "completed").length
  })).sort((a, b) => b.enrollments - a.enrollments);

  const activeStudents = users.filter(u => u.roles.includes("student") && u.status === "active").length;
  const adminUsers = users.filter(u => u.roles.includes("platform_admin")).length;

  return (
    <section className="page-section admin-dashboard">
      <header className="admin-hero-card">
        <div className="admin-hero-copy">
          <p className="eyebrow">Reportes y análisis</p>
          <h2>Panel de métricas de la plataforma</h2>
          <p>Visualiza el rendimiento académico, tasas de completación y uso de los escenarios de simulación 3D.</p>
        </div>
        <aside className="hero-side-panel">
          <div className="hero-side-header"><p className="eyebrow">Estado global</p><span className="status-chip is-live">En vivo</span></div>
          <div className="hero-side-meta"><span>Tasa de completación</span><strong>{completionRate}%</strong></div>
          <div className="hero-side-meta"><span>Cursos activos</span><strong>{courses.filter(c => c.status === "published").length}</strong></div>
        </aside>
      </header>

      <div className="admin-summary-grid">
        {[
          { label: "Usuarios registrados", value: users.length, detail: `${activeStudents} estudiantes activos` },
          { label: "Cursos publicados", value: courses.filter(c => c.status === "published").length, detail: `${courses.length} total en el catálogo` },
          { label: "Inscripciones activas", value: activeEnrollments, detail: `${completedEnrollments} completadas` },
          { label: "Escenarios 3D", value: scenarios.filter(s => s.status === "published").length, detail: `${scenarios.length} total configurados` }
        ].map(card => (
          <article key={card.label} className="admin-summary-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="admin-section-grid">
        <article className="admin-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Demanda académica</p>
              <h3>Cursos por inscripciones</h3>
            </div>
            <span className="panel-counter">{courses.length} cursos</span>
          </div>

          {courseEnrollmentCounts.length === 0 ? (
            <p>Sin datos de inscripciones aún.</p>
          ) : (
            <ul className="report-course-list">
              {courseEnrollmentCounts.map(c => {
                const pct = c.enrollments > 0 ? Math.round((c.completions / c.enrollments) * 100) : 0;
                return (
                  <li key={c.id} className="report-course-item">
                    <div className="report-course-info">
                      <span className="course-code sm">{c.code}</span>
                      <strong>{c.title}</strong>
                    </div>
                    <div className="report-course-stats">
                      <span>{c.enrollments} inscritos</span>
                      <div className="progress-bar-wrap">
                        <div className="progress-bar" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="progress-pct">{pct}%</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className="admin-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Distribución de usuarios</p>
              <h3>Roles en la plataforma</h3>
            </div>
          </div>

          <ul className="governance-list">
            {[
              { label: "Administradores", count: adminUsers, chip: "is-live" },
              { label: "Estudiantes activos", count: activeStudents, chip: "is-live" },
              { label: "Usuarios pendientes", count: users.filter(u => u.status === "pending").length, chip: "is-neutral" },
              { label: "Usuarios inactivos", count: users.filter(u => u.status === "disabled").length, chip: "is-disabled" }
            ].map(row => (
              <li key={row.label}>
                <div><strong>{row.label}</strong></div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <strong style={{ fontSize: "1.1rem" }}>{row.count}</strong>
                  <span className={`status-chip ${row.chip}`}>{row.count > 0 ? "activo" : "vacío"}</span>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Biblioteca de simulación</p>
            <h3>Escenarios Babylon.js registrados</h3>
          </div>
          <span className="panel-counter">{scenarios.length} escenarios</span>
        </div>

        {scenarios.length === 0 ? (
          <p>Sin escenarios registrados.</p>
        ) : (
          <ul className="admin-course-list">
            {scenarios.map(s => (
              <li key={s.id}>
                <div>
                  <strong>{s.title}</strong>
                  <span>{s.code} — v{s.version} — {s.difficulty}</span>
                </div>
                <span className={`status-chip ${s.status === "published" ? "is-live" : "is-draft"}`}>
                  {s.status === "published" ? "Publicado" : "Borrador"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
