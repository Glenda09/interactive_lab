import { useQuery } from "@tanstack/react-query";
import {
  getCourses,
  getEnrollments,
  getHealthCheck,
  getScenarios,
  getUsers,
  type CourseResponse,
  type EnrollmentResponse,
  type PlatformUserResponse,
  type ScenarioResponse
} from "../../../shared/lib/api/platform";

// ─── Mini chart helpers ───────────────────────────────────────────────────────

function DonutChart({
  slices
}: {
  slices: { value: number; color: string; label: string }[];
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 52;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg viewBox="0 0 140 140" className="donut-svg">
      {slices.map((slice, i) => {
        const pct = slice.value / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const rotation = (offset / total) * 360 - 90;
        offset += slice.value;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={slice.color}
            strokeWidth={16}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="butt"
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={42} fill="var(--surface-strong)" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={22} fontWeight={800} fill="var(--ink-main)">
        {total}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize={10} fill="var(--ink-muted)">
        total
      </text>
    </svg>
  );
}

function HBarChart({
  rows,
  maxValue
}: {
  rows: { label: string; value: number; color: string }[];
  maxValue: number;
}) {
  const max = maxValue || 1;
  return (
    <div className="hbar-chart">
      {rows.map((row) => (
        <div key={row.label} className="hbar-row">
          <span className="hbar-label">{row.label}</span>
          <div className="hbar-track">
            <div
              className="hbar-fill"
              style={{ width: `${(row.value / max) * 100}%`, background: row.color }}
            />
          </div>
          <span className="hbar-value">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat helpers ─────────────────────────────────────────────────────────────

function countBy<T>(items: T[], key: keyof T, value: string) {
  return items.filter((x) => x[key] === value).length;
}

function groupByRole(users: PlatformUserResponse[]) {
  const map: Record<string, number> = {};
  for (const u of users) {
    for (const r of u.roles) {
      map[r] = (map[r] ?? 0) + 1;
    }
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent
}: {
  label: string;
  value: string | number;
  sub: string;
  accent: string;
}) {
  return (
    <article className="kpi-card">
      <div className="kpi-accent" style={{ background: accent }} />
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value">{value}</strong>
      <p className="kpi-sub">{sub}</p>
    </article>
  );
}

// ─── Legend dot ───────────────────────────────────────────────────────────────

function Legend({ items }: { items: { color: string; label: string; value: number }[] }) {
  return (
    <div className="chart-legend">
      {items.map((it) => (
        <div key={it.label} className="legend-item">
          <span className="legend-dot" style={{ background: it.color }} />
          <span className="legend-label">{it.label}</span>
          <span className="legend-count">{it.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const healthQ = useQuery({ queryKey: ["health"], queryFn: getHealthCheck });
  const usersQ = useQuery({ queryKey: ["users"], queryFn: () => getUsers() });
  const coursesQ = useQuery({ queryKey: ["courses"], queryFn: () => getCourses() });
  const enrollmentsQ = useQuery({ queryKey: ["enrollments"], queryFn: () => getEnrollments() });
  const scenariosQ = useQuery({ queryKey: ["scenarios"], queryFn: () => getScenarios() });

  const users: PlatformUserResponse[] = Array.isArray(usersQ.data) ? usersQ.data : [];
  const courses: CourseResponse[] = Array.isArray(coursesQ.data) ? coursesQ.data : [];
  const enrollments: EnrollmentResponse[] = Array.isArray(enrollmentsQ.data)
    ? enrollmentsQ.data
    : [];
  const scenarios: ScenarioResponse[] = Array.isArray(scenariosQ.data) ? scenariosQ.data : [];

  // Users
  const activeUsers = countBy(users, "status", "active");
  const inactiveUsers = users.length - activeUsers;
  const roleGroups = groupByRole(users);
  const maxRoleCount = roleGroups[0]?.[1] ?? 1;

  // Courses
  const publishedCourses = countBy(courses, "status", "published");
  const draftCourses = countBy(courses, "status", "draft");
  const archivedCourses = countBy(courses, "status", "archived");
  const totalModules = courses.reduce((s, c) => s + (c.modules?.length ?? 0), 0);
  const simModules = courses.reduce(
    (s, c) => s + (c.modules?.filter((m) => m.type === "simulation").length ?? 0),
    0
  );

  // Enrollments
  const activeEnrollments = countBy(enrollments, "status", "active");
  const completedEnrollments = countBy(enrollments, "status", "completed");
  const droppedEnrollments = countBy(enrollments, "status", "dropped");
  const suspendedEnrollments = countBy(enrollments, "status", "suspended");
  const maxEnrollCount = Math.max(
    activeEnrollments,
    completedEnrollments,
    droppedEnrollments,
    suspendedEnrollments,
    1
  );

  // Scenarios
  const publishedScenarios = countBy(scenarios, "status", "published");
  const beginnerScenarios = countBy(scenarios, "difficulty", "beginner");
  const intermediateScenarios = countBy(scenarios, "difficulty", "intermediate");
  const advancedScenarios = countBy(scenarios, "difficulty", "advanced");
  const maxDiffCount = Math.max(beginnerScenarios, intermediateScenarios, advancedScenarios, 1);

  // Course donut data
  const courseSlices = [
    { value: publishedCourses, color: "#2ec5ce", label: "Publicados" },
    { value: draftCourses, color: "#f59e0b", label: "Borrador" },
    { value: archivedCourses, color: "#94a3b8", label: "Archivados" }
  ];

  const recentCourses = [...courses]
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 5);

  return (
    <section className="page-section admin-dashboard">

      {/* ── KPI Cards ── */}
      <div className="kpi-grid">
        <KpiCard
          label="Usuarios registrados"
          value={users.length}
          sub={`${activeUsers} activos · ${inactiveUsers} inactivos`}
          accent="linear-gradient(135deg,#0e2238,#2ec5ce)"
        />
        <KpiCard
          label="Cursos en catálogo"
          value={courses.length}
          sub={`${publishedCourses} publicados · ${draftCourses} borrador`}
          accent="linear-gradient(135deg,#0e5238,#2ece8a)"
        />
        <KpiCard
          label="Inscripciones"
          value={enrollments.length}
          sub={`${activeEnrollments} activas · ${completedEnrollments} completadas`}
          accent="linear-gradient(135deg,#38180e,#ce7a2e)"
        />
        <KpiCard
          label="Escenarios 3D"
          value={scenarios.length}
          sub={`${publishedScenarios} publicados · ${simModules} módulos sim.`}
          accent="linear-gradient(135deg,#2a0e38,#9b2ece)"
        />
      </div>

      {/* ── Charts row 1: Cursos + Inscripciones ── */}
      <div className="charts-grid">
        <article className="admin-panel chart-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Catálogo académico</p>
              <h3>Cursos por estado</h3>
            </div>
            <span className="panel-counter">{courses.length} registros</span>
          </div>
          <div className="chart-donut-layout">
            <DonutChart slices={courseSlices} />
            <div className="chart-donut-side">
              <Legend
                items={[
                  { color: "#2ec5ce", label: "Publicados", value: publishedCourses },
                  { color: "#f59e0b", label: "Borrador", value: draftCourses },
                  { color: "#94a3b8", label: "Archivados", value: archivedCourses }
                ]}
              />
              <div className="chart-stat-list">
                <div className="chart-stat-row">
                  <span>Módulos totales</span>
                  <strong>{totalModules}</strong>
                </div>
                <div className="chart-stat-row">
                  <span>Módulos simulación</span>
                  <strong>{simModules}</strong>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="admin-panel chart-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Actividad académica</p>
              <h3>Inscripciones por estado</h3>
            </div>
            <span className="panel-counter">{enrollments.length} total</span>
          </div>
          <HBarChart
            maxValue={maxEnrollCount}
            rows={[
              { label: "Activas", value: activeEnrollments, color: "#2ec5ce" },
              { label: "Completadas", value: completedEnrollments, color: "#22c55e" },
              { label: "Abandonadas", value: droppedEnrollments, color: "#f97316" },
              { label: "Suspendidas", value: suspendedEnrollments, color: "#ef4444" }
            ]}
          />
          {enrollments.length === 0 && !enrollmentsQ.isLoading && (
            <p style={{ color: "var(--ink-muted)", fontSize: "0.88rem" }}>
              Sin inscripciones registradas aún.
            </p>
          )}
        </article>
      </div>

      {/* ── Charts row 2: Usuarios + Escenarios ── */}
      <div className="charts-grid">
        <article className="admin-panel chart-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Gestión de acceso</p>
              <h3>Usuarios por rol</h3>
            </div>
            <span className="panel-counter">{users.length} usuarios</span>
          </div>
          {roleGroups.length > 0 ? (
            <HBarChart
              maxValue={maxRoleCount}
              rows={roleGroups.map(([role, count], i) => ({
                label: role,
                value: count,
                color: ["#2ec5ce", "#6366f1", "#f59e0b", "#22c55e", "#ef4444"][i % 5]
              }))}
            />
          ) : (
            <p style={{ color: "var(--ink-muted)", fontSize: "0.88rem" }}>
              {usersQ.isLoading ? "Cargando usuarios..." : "Sin datos de roles."}
            </p>
          )}
          <div className="chart-stat-list">
            <div className="chart-stat-row">
              <span>Usuarios activos</span>
              <strong>{activeUsers}</strong>
            </div>
            <div className="chart-stat-row">
              <span>Usuarios inactivos</span>
              <strong>{inactiveUsers}</strong>
            </div>
          </div>
        </article>

        <article className="admin-panel chart-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Simulación 3D</p>
              <h3>Escenarios por dificultad</h3>
            </div>
            <span className="panel-counter">{scenarios.length} escenarios</span>
          </div>
          <HBarChart
            maxValue={maxDiffCount}
            rows={[
              { label: "Principiante", value: beginnerScenarios, color: "#22c55e" },
              { label: "Intermedio", value: intermediateScenarios, color: "#f59e0b" },
              { label: "Avanzado", value: advancedScenarios, color: "#ef4444" }
            ]}
          />
          <Legend
            items={[
              { color: "#2ec5ce", label: "Publicados", value: publishedScenarios },
              { color: "#f59e0b", label: "Borrador", value: countBy(scenarios, "status", "draft") },
              { color: "#94a3b8", label: "Archivados", value: countBy(scenarios, "status", "archived") }
            ]}
          />
        </article>
      </div>

      {/* ── Bottom row: Courses list + Health ── */}
      <div className="admin-section-grid">
        <article className="admin-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Catálogo operativo</p>
              <h3>Cursos recientes</h3>
            </div>
            <span className="panel-counter">{courses.length} registros</span>
          </div>
          {coursesQ.isLoading && <p>Cargando catálogo...</p>}
          {coursesQ.isError && (
            <p style={{ color: "var(--danger-ink)" }}>
              No se pudo recuperar el catálogo. Verifica la conexión al backend.
            </p>
          )}
          {recentCourses.length > 0 && (
            <ul className="admin-course-list">
              {recentCourses.map((course) => (
                <li key={course.id}>
                  <div>
                    <strong>{course.title}</strong>
                    <span>{`${course.code} · ${course.modules?.length ?? 0} módulos · ${course.estimatedHours}h`}</span>
                  </div>
                  <span
                    className={`status-chip ${
                      course.status === "published"
                        ? "is-live"
                        : course.status === "archived"
                          ? "is-neutral"
                          : "is-draft"
                    }`}
                  >
                    {course.status === "published"
                      ? "Publicado"
                      : course.status === "archived"
                        ? "Archivado"
                        : "Borrador"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="admin-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Estado de plataforma</p>
              <h3>Salud del servicio</h3>
            </div>
          </div>
          {healthQ.isLoading && <p>Consultando backend...</p>}
          {healthQ.isError && (
            <div className="admin-status-block is-alert">
              <strong>Sin conectividad</strong>
              <p>El frontend no pudo validar el servicio principal.</p>
            </div>
          )}
          {healthQ.data && (
            <div className="admin-status-block">
              <div className="admin-status-line">
                <span>Servicio</span>
                <strong>{healthQ.data.service}</strong>
              </div>
              <div className="admin-status-line">
                <span>Estado</span>
                <strong>{healthQ.data.status}</strong>
              </div>
              <div className="admin-status-line">
                <span>Última respuesta</span>
                <strong>{new Date(healthQ.data.timestamp).toLocaleString()}</strong>
              </div>
            </div>
          )}

          <div className="chart-stat-list" style={{ marginTop: 4 }}>
            <div className="chart-stat-row">
              <span>Módulos simulación</span>
              <strong>{simModules}</strong>
            </div>
            <div className="chart-stat-row">
              <span>Escenarios 3D publicados</span>
              <strong>{publishedScenarios}</strong>
            </div>
            <div className="chart-stat-row">
              <span>Tasa de completado</span>
              <strong>
                {enrollments.length > 0
                  ? `${Math.round((completedEnrollments / enrollments.length) * 100)}%`
                  : "—"}
              </strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
