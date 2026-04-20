import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCourse, getMyCourseProgress, getMyEnrollments, selfEnroll } from "../../../shared/lib/api/platform";
import { useAuthStore } from "../../auth/state/useAuthStore";

const TYPE_LABELS: Record<string, string> = { simulation: "Simulación 3D", theory: "Contenido teórico", assessment: "Evaluación" };
const LEVEL_LABELS: Record<string, string> = { beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado" };

function BackIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M13 15l-5-5 5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}
function PlayIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M7 4l10 6-10 6V4z" fill="currentColor" /></svg>;
}
function CheckIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 10l5 5 8-8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>;
}
function LockIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><rect fill="none" height="9" rx="2" stroke="currentColor" strokeWidth="1.7" width="12" x="4" y="9" /><path d="M7 9V7a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>;
}

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);

  const courseQuery = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourse(courseId!),
    enabled: !!courseId
  });

  const enrollmentsQuery = useQuery({ queryKey: ["my-enrollments"], queryFn: getMyEnrollments });

  const progressQuery = useQuery({
    queryKey: ["my-progress", courseId],
    queryFn: () => getMyCourseProgress(courseId!),
    enabled: !!courseId,
    retry: false
  });

  const enrollMutation = useMutation({
    mutationFn: () => selfEnroll(courseId!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-enrollments"] });
      void qc.invalidateQueries({ queryKey: ["my-progress", courseId] });
    }
  });

  const course = courseQuery.data;
  const enrollments = enrollmentsQuery.data ?? [];
  const myEnrollment = enrollments.find(e => e.courseId === courseId);
  const progress = progressQuery.data;
  const isEnrolled = !!myEnrollment;

  if (courseQuery.isLoading) return <div className="page-section"><p>Cargando curso...</p></div>;
  if (!course) return <div className="page-section"><p>Curso no encontrado.</p></div>;

  function getModuleStatus(idx: number) {
    if (!progress) return "locked";
    const mod = progress.modules.find(m => m.moduleIndex === idx);
    return mod?.status ?? "pending";
  }

  function canAccessModule(idx: number) {
    if (!isEnrolled) return false;
    if (idx === 0) return true;
    const prev = progress?.modules.find(m => m.moduleIndex === idx - 1);
    return prev?.status === "completed";
  }

  return (
    <section className="page-section course-detail">
      <div className="course-detail-hero">
        <Link to="/learn/my-courses" className="back-link">
          <BackIcon /> Mis cursos
        </Link>

        <div className="course-detail-hero-content">
          <div className="course-detail-info">
            <span className="course-code">{course.code}</span>
            <h2>{course.title}</h2>
            <p>{course.description}</p>

            <div className="course-meta-row">
              <span className="meta-pill">{LEVEL_LABELS[course.level]}</span>
              <span className="meta-pill">{course.category}</span>
              <span className="meta-pill">{course.estimatedHours}h estimadas</span>
              <span className="meta-pill">{course.modules?.length ?? 0} módulos</span>
            </div>

            {course.objectives && course.objectives.length > 0 && (
              <div className="course-objectives">
                <strong>Objetivos del curso:</strong>
                <ul>
                  {course.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                </ul>
              </div>
            )}

            {!isEnrolled && (
              <button
                className="primary-button lg"
                disabled={enrollMutation.isPending}
                onClick={() => enrollMutation.mutate()}
                type="button"
              >
                {enrollMutation.isPending ? "Inscribiendo..." : "Inscribirme al curso"}
              </button>
            )}

            {isEnrolled && progress && (
              <div className="course-overall-progress">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <strong>Progreso general</strong>
                  <strong>{progress.progressPct}%</strong>
                </div>
                <div className="progress-bar-wrap lg">
                  <div className="progress-bar" style={{ width: `${progress.progressPct}%` }} />
                </div>
                {progress.completedAt && (
                  <p style={{ color: "var(--success-ink)", marginTop: 8 }}>
                    ✓ Completado el {new Date(progress.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="course-detail-3d">
            <svg viewBox="0 0 200 170" aria-hidden="true">
              <defs>
                <linearGradient id="cdg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--brand-deep)" />
                  <stop offset="100%" stopColor="var(--brand-panel)" />
                </linearGradient>
              </defs>
              <rect fill="url(#cdg)" height="170" rx="20" width="200" />
              <polygon fill="var(--brand-accent)" opacity="0.5" points="100,20 160,50 160,110 100,140 40,110 40,50" />
              <polygon fill="white" opacity="0.15" points="100,20 160,50 100,80" />
              <polygon fill="white" opacity="0.1" points="100,80 160,50 160,110" />
              <polygon fill="white" opacity="0.12" points="100,80 40,50 40,110" />
              <circle cx="100" cy="80" fill="var(--brand-accent)" r="20" />
              <path d="M92 80l6 6 12-12" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
            </svg>
          </div>
        </div>
      </div>

      <div className="course-modules-section">
        <h3>Contenido del curso</h3>
        <p className="panel-copy">{course.modules?.length ?? 0} módulos · Cada módulo incluye una simulación 3D interactiva con Babylon.js</p>

        <div className="module-list">
          {(course.modules ?? []).map((mod, idx) => {
            const status = getModuleStatus(idx);
            const canAccess = canAccessModule(idx);
            const modProgress = progress?.modules.find(m => m.moduleIndex === idx);

            return (
              <div
                key={idx}
                className={`module-card ${status === "completed" ? "is-completed" : ""} ${!canAccess && isEnrolled ? "is-locked" : ""}`}
              >
                <div className="module-card-number">
                  {status === "completed" ? <CheckIcon /> : !canAccess && isEnrolled ? <LockIcon /> : <span>{idx + 1}</span>}
                </div>

                <div className="module-card-info">
                  <div className="module-card-header">
                    <h4>{mod.title}</h4>
                    <span className={`module-type-badge ${mod.type}`}>
                      {TYPE_LABELS[mod.type] ?? mod.type}
                    </span>
                  </div>
                  <p>{mod.description || "Módulo de capacitación con escenario 3D interactivo."}</p>
                  <div className="module-card-meta">
                    <span>{mod.estimatedMinutes} min</span>
                    {modProgress && (
                      <span>Intentos: {modProgress.attempts}</span>
                    )}
                    {modProgress?.bestScore != null && (
                      <span>Mejor puntaje: {modProgress.bestScore}%</span>
                    )}
                  </div>
                </div>

                <div className="module-card-action">
                  {isEnrolled && canAccess && mod.scenarioId ? (
                    <Link
                      to={`/simulation?scenarioId=${mod.scenarioId}&courseId=${course.id}&moduleIndex=${idx}`}
                      className={`primary-button sm ${status === "completed" ? "secondary-button" : ""}`}
                    >
                      <PlayIcon />
                      {status === "completed" ? "Repetir" : status === "in_progress" ? "Continuar" : "Iniciar"}
                    </Link>
                  ) : isEnrolled && !canAccess ? (
                    <span className="locked-hint">Completa el módulo anterior</span>
                  ) : !isEnrolled ? (
                    <span className="locked-hint">Inscríbete para acceder</span>
                  ) : (
                    <span className="locked-hint">Sin escenario 3D</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {course.modules?.length === 0 && (
          <div className="empty-state">
            <p>Este curso aún no tiene módulos configurados.</p>
          </div>
        )}
      </div>
    </section>
  );
}
