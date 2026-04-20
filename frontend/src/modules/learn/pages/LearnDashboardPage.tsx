import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getCourses, getMyEnrollments, getMyProgress } from "../../../shared/lib/api/platform";
import { useAuthStore } from "../../auth/state/useAuthStore";

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M7 5l6 5-6 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}
function StarIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M10 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L10 14.4l-4.8 2.5.9-5.4L2.2 7.7l5.4-.8z" fill="currentColor" /></svg>;
}
function PlayIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M7 4l10 6-10 6V4z" fill="currentColor" /></svg>;
}

export function LearnDashboardPage() {
  const user = useAuthStore(s => s.user);
  const enrollmentsQuery = useQuery({ queryKey: ["my-enrollments"], queryFn: getMyEnrollments });
  const progressQuery = useQuery({ queryKey: ["my-progress"], queryFn: getMyProgress });
  const coursesQuery = useQuery({ queryKey: ["courses-published"], queryFn: () => getCourses(true) });

  const enrollments = enrollmentsQuery.data ?? [];
  const allProgress = progressQuery.data ?? [];
  const publishedCourses = coursesQuery.data ?? [];

  const activeEnrollments = enrollments.filter(e => e.status === "active");
  const completedEnrollments = enrollments.filter(e => e.status === "completed");

  const avgProgress = allProgress.length > 0
    ? Math.round(allProgress.reduce((acc, p) => acc + p.progressPct, 0) / allProgress.length)
    : 0;

  const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));
  const suggestedCourses = publishedCourses.filter(c => !enrolledCourseIds.has(c.id)).slice(0, 3);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const firstName = user?.email.split("@")[0] ?? "estudiante";

  return (
    <section className="page-section learn-dashboard">
      <div className="learn-hero">
        <div className="learn-hero-content">
          <p className="eyebrow">Plataforma de Capacitación Virtual con Simulación 3D</p>
          <h2>{greeting}, {firstName}</h2>
          <p>Continúa tu capacitación en los escenarios de simulación industrial.</p>
        </div>
        <div className="learn-hero-stats">
          <div className="learn-stat">
            <strong>{activeEnrollments.length}</strong>
            <span>Cursos activos</span>
          </div>
          <div className="learn-stat">
            <strong>{completedEnrollments.length}</strong>
            <span>Completados</span>
          </div>
          <div className="learn-stat">
            <strong>{avgProgress}%</strong>
            <span>Progreso promedio</span>
          </div>
        </div>
      </div>

      {activeEnrollments.length > 0 && (
        <section className="learn-section">
          <div className="learn-section-header">
            <h3>Continúa aprendiendo</h3>
            <Link to="/learn/my-courses" className="learn-see-all">Ver todos</Link>
          </div>
          <div className="learn-course-row">
            {activeEnrollments.slice(0, 3).map(enrollment => {
              const progress = allProgress.find(p => p.courseId === enrollment.courseId);
              const course = publishedCourses.find(c => c.id === enrollment.courseId);
              if (!course) return null;

              return (
                <Link key={enrollment.id} to={`/learn/courses/${course.id}`} className="learn-course-card">
                  <div className="learn-course-card-3d">
                    <svg viewBox="0 0 80 60" aria-hidden="true">
                      <defs>
                        <linearGradient id={`g${course.id}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="var(--brand-panel)" stopOpacity="0.9" />
                        </linearGradient>
                      </defs>
                      <polygon fill={`url(#g${course.id})`} points="40,8 68,22 68,44 40,58 12,44 12,22" />
                      <polygon fill="white" opacity="0.15" points="40,8 68,22 40,36" />
                      <circle cx="40" cy="33" fill="white" opacity="0.9" r="8" />
                    </svg>
                    <button className="learn-play-btn" type="button" aria-label="Iniciar simulación">
                      <PlayIcon />
                    </button>
                  </div>
                  <div className="learn-course-card-body">
                    <span className="course-code sm">{course.code}</span>
                    <h4>{course.title}</h4>
                    <div className="learn-progress">
                      <div className="progress-bar-wrap">
                        <div className="progress-bar" style={{ width: `${progress?.progressPct ?? 0}%` }} />
                      </div>
                      <span>{progress?.progressPct ?? 0}%</span>
                    </div>
                    <span className="module-info">{course.modules?.length ?? 0} módulos · {course.estimatedHours}h</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {suggestedCourses.length > 0 && (
        <section className="learn-section">
          <div className="learn-section-header">
            <h3>Cursos disponibles para ti</h3>
            <Link to="/learn/catalog" className="learn-see-all">Ver catálogo <ArrowIcon /></Link>
          </div>
          <div className="learn-course-row">
            {suggestedCourses.map(course => (
              <Link key={course.id} to={`/learn/courses/${course.id}`} className="learn-course-card">
                <div className="learn-course-card-3d suggested">
                  <svg viewBox="0 0 80 60" aria-hidden="true">
                    <polygon fill="var(--brand-panel)" opacity="0.7" points="40,8 68,22 68,44 40,58 12,44 12,22" />
                    <polygon fill="white" opacity="0.1" points="40,8 68,22 40,36" />
                    <polygon fill="white" opacity="0.15" points="40,36 68,22 68,44" />
                    <circle cx="40" cy="33" fill="var(--brand-accent)" opacity="0.8" r="8" />
                  </svg>
                  <span className="level-badge">{course.level === "beginner" ? "Principiante" : course.level === "intermediate" ? "Intermedio" : "Avanzado"}</span>
                </div>
                <div className="learn-course-card-body">
                  <span className="course-code sm">{course.code}</span>
                  <h4>{course.title}</h4>
                  <p className="course-description">{course.description?.slice(0, 80) ?? ""}...</p>
                  <div className="course-meta-row">
                    <span className="meta-pill">{course.modules?.length ?? 0} módulos</span>
                    <span className="meta-pill">{course.estimatedHours}h</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {enrollments.length === 0 && (
        <div className="learn-empty-hero">
          <div className="learn-empty-3d">
            <svg viewBox="0 0 120 100" aria-hidden="true">
              <polygon fill="var(--brand-accent)" opacity="0.2" points="60,10 100,30 100,70 60,90 20,70 20,30" />
              <polygon fill="var(--brand-accent)" opacity="0.6" points="60,10 100,30 60,50" />
              <polygon fill="var(--brand-panel)" opacity="0.6" points="60,50 100,30 100,70" />
              <polygon fill="var(--brand-accent-strong)" opacity="0.5" points="60,50 20,30 20,70" />
              <circle cx="60" cy="50" fill="var(--brand-accent)" r="12" />
            </svg>
          </div>
          <h3>¡Bienvenido a la plataforma de capacitación 3D!</h3>
          <p>Explora el catálogo de cursos y comienza tu capacitación con simulaciones industriales en tiempo real.</p>
          <Link to="/learn/catalog" className="primary-button">
            <StarIcon /> Explorar cursos
          </Link>
        </div>
      )}
    </section>
  );
}
