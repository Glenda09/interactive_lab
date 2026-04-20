import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getCourses, getMyEnrollments, getMyProgress } from "../../../shared/lib/api/platform";

const STATUS_LABELS: Record<string, string> = { active: "En progreso", completed: "Completado", dropped: "Abandonado", suspended: "Suspendido" };

export function MyCoursesPage() {
  const enrollmentsQuery = useQuery({ queryKey: ["my-enrollments"], queryFn: getMyEnrollments });
  const progressQuery = useQuery({ queryKey: ["my-progress"], queryFn: getMyProgress });
  const coursesQuery = useQuery({ queryKey: ["courses-published"], queryFn: () => getCourses(true) });

  const enrollments = enrollmentsQuery.data ?? [];
  const allProgress = progressQuery.data ?? [];
  const courses = coursesQuery.data ?? [];

  function getCourse(courseId: string) {
    return courses.find(c => c.id === courseId);
  }

  function getProgress(courseId: string) {
    return allProgress.find(p => p.courseId === courseId);
  }

  const active = enrollments.filter(e => e.status === "active");
  const completed = enrollments.filter(e => e.status === "completed");
  const other = enrollments.filter(e => e.status !== "active" && e.status !== "completed");

  if (enrollmentsQuery.isLoading) return <div className="page-section"><p>Cargando tus cursos...</p></div>;

  if (enrollments.length === 0) {
    return (
      <section className="page-section learn-dashboard">
        <div className="learn-empty-hero">
          <h3>Aún no tienes cursos</h3>
          <p>Explora el catálogo y comienza tu capacitación en simulación 3D.</p>
          <Link to="/learn/catalog" className="primary-button">Explorar catálogo</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section learn-dashboard">
      <div className="catalog-header">
        <p className="eyebrow">Mi formación</p>
        <h2>Mis cursos de capacitación</h2>
        <p>{enrollments.length} inscripción{enrollments.length !== 1 ? "es" : ""} registrada{enrollments.length !== 1 ? "s" : ""}.</p>
      </div>

      {active.length > 0 && (
        <section className="learn-section">
          <h3>En progreso ({active.length})</h3>
          <div className="my-courses-list">
            {active.map(e => {
              const course = getCourse(e.courseId);
              const progress = getProgress(e.courseId);
              if (!course) return null;
              const pct = progress?.progressPct ?? 0;
              const completedModules = progress?.modules.filter(m => m.status === "completed").length ?? 0;

              return (
                <Link key={e.id} to={`/learn/courses/${course.id}`} className="my-course-item">
                  <div className="my-course-3d">
                    <svg viewBox="0 0 60 50" aria-hidden="true">
                      <polygon fill="var(--brand-panel)" opacity="0.9" points="30,5 52,17 52,37 30,49 8,37 8,17" />
                      <polygon fill="var(--brand-accent)" opacity="0.6" points="30,5 52,17 30,27" />
                      <circle cx="30" cy="28" fill="var(--brand-accent)" r="7" />
                    </svg>
                  </div>
                  <div className="my-course-info">
                    <span className="course-code sm">{course.code}</span>
                    <h4>{course.title}</h4>
                    <div className="learn-progress">
                      <div className="progress-bar-wrap">
                        <div className="progress-bar" style={{ width: `${pct}%` }} />
                      </div>
                      <span>{pct}%</span>
                    </div>
                    <p className="module-info">{completedModules} / {course.modules?.length ?? 0} módulos completados · {course.estimatedHours}h</p>
                  </div>
                  <span className={`status-chip is-live`}>{STATUS_LABELS[e.status]}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className="learn-section">
          <h3>Completados ({completed.length})</h3>
          <div className="my-courses-list">
            {completed.map(e => {
              const course = getCourse(e.courseId);
              if (!course) return null;

              return (
                <Link key={e.id} to={`/learn/courses/${course.id}`} className="my-course-item completed">
                  <div className="my-course-3d">
                    <svg viewBox="0 0 60 50" aria-hidden="true">
                      <polygon fill="var(--success-ink)" opacity="0.4" points="30,5 52,17 52,37 30,49 8,37 8,17" />
                      <circle cx="30" cy="27" fill="var(--success-ink)" r="10" />
                      <path d="M24 27l4 4 8-8" fill="none" stroke="white" strokeLinecap="round" strokeWidth="2.5" />
                    </svg>
                  </div>
                  <div className="my-course-info">
                    <span className="course-code sm">{course.code}</span>
                    <h4>{course.title}</h4>
                    <p className="module-info">Completado el {e.completedAt ? new Date(e.completedAt).toLocaleDateString() : "—"}</p>
                  </div>
                  <span className="status-chip is-success">Completado ✓</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {other.length > 0 && (
        <section className="learn-section">
          <h3>Otros ({other.length})</h3>
          <div className="my-courses-list">
            {other.map(e => {
              const course = getCourse(e.courseId);
              if (!course) return null;
              return (
                <div key={e.id} className="my-course-item disabled-item">
                  <div className="my-course-info">
                    <span className="course-code sm">{course.code}</span>
                    <h4>{course.title}</h4>
                  </div>
                  <span className="status-chip is-disabled">{STATUS_LABELS[e.status] ?? e.status}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
