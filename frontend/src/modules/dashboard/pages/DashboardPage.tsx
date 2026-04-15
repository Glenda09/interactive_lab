import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../auth/state/useAuthStore";
import {
  CourseSummaryResponse,
  getCourses,
  getHealthCheck
} from "../../../shared/lib/api/platform";

const governanceItems = [
  {
    label: "Politica de acceso",
    detail: "Login, rotacion de refresh y recuperacion segura ya quedaron conectados a Mongo.",
    status: "operativa"
  },
  {
    label: "Catalogo academico",
    detail:
      "Revisar criterios de publicacion, due owners y versionado de cursos antes de abrir alta masiva.",
    status: "en revision"
  },
  {
    label: "Operacion de simulacion",
    detail: "Alinear scoring, evidencia y resultados del runtime 3D con las rutas formativas.",
    status: "siguiente bloque"
  }
];

function countByStatus(courses: CourseSummaryResponse[], status: string) {
  return courses.filter((course) => course.status === status).length;
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const healthQuery = useQuery({
    queryKey: ["platform-health"],
    queryFn: getHealthCheck
  });
  const coursesQuery = useQuery({
    queryKey: ["platform-courses"],
    queryFn: getCourses
  });

  const courses = coursesQuery.data ?? [];
  const publishedCourses = countByStatus(courses, "published");
  const draftCourses = countByStatus(courses, "draft");
  const totalModules = courses.reduce((total, course) => total + course.modules, 0);

  const summaryCards = [
    {
      label: "Cursos publicados",
      value: String(publishedCourses),
      detail: "Oferta disponible para estudiantes y cohortes activas."
    },
    {
      label: "Cursos en borrador",
      value: String(draftCourses),
      detail: "Contenido pendiente de aprobacion academica."
    },
    {
      label: "Modulos configurados",
      value: String(totalModules),
      detail: "Carga formativa total visible desde el catalogo."
    },
    {
      label: "Roles de la sesion",
      value: String(user?.roles.length ?? 0),
      detail: user?.roles.join(", ") ?? "Sin roles detectados"
    }
  ];

  return (
    <section className="page-section admin-dashboard">
      <header className="admin-hero-card">
        <div className="admin-hero-copy">
          <p className="eyebrow">Centro administrativo</p>
          <h2>Supervisa acceso, catalogo y operacion academica desde un mismo panel</h2>
          <p>
            Esta vista prioriza control operativo: estado del backend, sesion autenticada,
            disponibilidad del catalogo y proximos frentes de gobierno para la plataforma.
          </p>
        </div>

        <aside className="hero-side-panel">
          <div className="hero-side-header">
            <p className="eyebrow">Sesion actual</p>
            <span className="status-chip is-live">Activa</span>
          </div>
          <strong>{user?.email ?? "Sin usuario autenticado"}</strong>
          <p>{user?.roles.join(", ") ?? "Sin roles asociados"}</p>
          <div className="hero-side-meta">
            <span>Permisos visibles</span>
            <strong>{user?.permissions.length ?? 0}</strong>
          </div>
        </aside>
      </header>

      <div className="admin-summary-grid">
        {summaryCards.map((card) => (
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
              <p className="eyebrow">Catalogo operativo</p>
              <h3>Cursos priorizados</h3>
            </div>
            <span className="panel-counter">{courses.length} registros</span>
          </div>

          {coursesQuery.isLoading && <p>Cargando cursos del backend...</p>}
          {coursesQuery.isError && (
            <p>
              No fue posible recuperar el catalogo. Revisa el token actual o la disponibilidad de
              la API.
            </p>
          )}
          {courses.length > 0 && (
            <ul className="admin-course-list">
              {courses.map((course) => (
                <li key={course.id}>
                  <div>
                    <strong>{course.title}</strong>
                    <span>{`${course.code} - ${course.modules} modulos - ${course.estimatedDurationHours} h`}</span>
                  </div>
                  <span
                    className={`status-chip ${
                      course.status === "published" ? "is-live" : "is-draft"
                    }`}
                  >
                    {course.status === "published" ? "Publicado" : "Borrador"}
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

          {healthQuery.isLoading && <p>Consultando backend...</p>}
          {healthQuery.isError && (
            <div className="admin-status-block is-alert">
              <strong>Sin conectividad</strong>
              <p>El frontend no pudo validar el servicio principal en este momento.</p>
            </div>
          )}
          {healthQuery.data && (
            <div className="admin-status-block">
              <div className="admin-status-line">
                <span>Servicio</span>
                <strong>{healthQuery.data.service}</strong>
              </div>
              <div className="admin-status-line">
                <span>Estado</span>
                <strong>{healthQuery.data.status}</strong>
              </div>
              <div className="admin-status-line">
                <span>Ultima respuesta</span>
                <strong>{new Date(healthQuery.data.timestamp).toLocaleString()}</strong>
              </div>
            </div>
          )}
        </article>
      </div>

      <article className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Gobierno y cumplimiento</p>
            <h3>Checklist de salida inicial</h3>
          </div>
        </div>

        <ul className="governance-list">
          {governanceItems.map((item) => (
            <li key={item.label}>
              <div>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </div>
              <span className="status-chip is-neutral">{item.status}</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
