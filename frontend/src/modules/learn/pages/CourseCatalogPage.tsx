import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getCourses, getMyEnrollments, selfEnroll } from "../../../shared/lib/api/platform";

const LEVEL_LABELS: Record<string, string> = { beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado" };

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="9" cy="9" fill="none" r="5.5" stroke="currentColor" strokeWidth="1.7" /><path d="M14 14l3 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}
function StarIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M10 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L10 14.4l-4.8 2.5.9-5.4L2.2 7.7l5.4-.8z" fill="currentColor" /></svg>;
}

export function CourseCatalogPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");

  const coursesQuery = useQuery({ queryKey: ["courses-published"], queryFn: () => getCourses(true) });
  const enrollmentsQuery = useQuery({ queryKey: ["my-enrollments"], queryFn: getMyEnrollments });

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => selfEnroll(courseId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["my-enrollments"] })
  });

  const courses = coursesQuery.data ?? [];
  const myEnrollments = enrollmentsQuery.data ?? [];
  const enrolledCourseIds = new Set(myEnrollments.map(e => e.courseId));

  const filtered = courses.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === "all" || c.level === levelFilter;
    return matchSearch && matchLevel;
  });

  return (
    <section className="page-section learn-dashboard">
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Oferta académica</p>
          <h2>Catálogo de cursos de capacitación 3D</h2>
          <p>Cursos de simulación industrial con tecnología Babylon.js. Cada módulo incluye un escenario 3D interactivo.</p>
        </div>
      </div>

      <div className="catalog-filters">
        <div className="catalog-search">
          <SearchIcon />
          <input
            placeholder="Buscar por título, código o categoría..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {(["all", "beginner", "intermediate", "advanced"] as const).map(level => (
            <button key={level} className={`filter-tab ${levelFilter === level ? "is-active" : ""}`} onClick={() => setLevelFilter(level)} type="button">
              {level === "all" ? "Todos los niveles" : LEVEL_LABELS[level]}
            </button>
          ))}
        </div>
      </div>

      {coursesQuery.isLoading && <p>Cargando catálogo...</p>}

      {filtered.length === 0 && !coursesQuery.isLoading && (
        <div className="empty-state">
          <p>No se encontraron cursos con los filtros actuales.</p>
        </div>
      )}

      <div className="catalog-grid">
        {filtered.map(course => {
          const isEnrolled = enrolledCourseIds.has(course.id);
          const enrollment = myEnrollments.find(e => e.courseId === course.id);

          return (
            <article key={course.id} className="catalog-card">
              <div className="catalog-card-visual">
                <svg viewBox="0 0 200 130" aria-hidden="true">
                  <defs>
                    <linearGradient id={`cg${course.id}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--brand-deep)" />
                      <stop offset="100%" stopColor="var(--brand-panel)" />
                    </linearGradient>
                  </defs>
                  <rect fill={`url(#cg${course.id})`} height="130" rx="0" width="200" />
                  <polygon fill="var(--brand-accent)" opacity="0.3" points="100,20 150,45 150,85 100,110 50,85 50,45" />
                  <polygon fill="white" opacity="0.15" points="100,20 150,45 100,67" />
                  <polygon fill="white" opacity="0.08" points="100,67 150,45 150,85" />
                  <polygon fill="white" opacity="0.12" points="100,67 50,45 50,85" />
                  <circle cx="100" cy="65" fill="var(--brand-accent)" opacity="0.9" r="14" />
                  <path d="M94 65l5 4 8-8" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                </svg>
                <div className="catalog-card-overlay">
                  <span className="level-badge">{LEVEL_LABELS[course.level] ?? course.level}</span>
                  <span className="babylon-badge">Babylon.js</span>
                </div>
              </div>

              <div className="catalog-card-body">
                <span className="course-code">{course.code}</span>
                <h3>{course.title}</h3>
                <p className="course-description">{course.description?.slice(0, 120) || "Capacitación industrial con simulación 3D interactiva."}</p>

                <div className="course-meta-row">
                  <span className="meta-pill">{course.modules?.length ?? 0} módulos</span>
                  <span className="meta-pill">{course.estimatedHours}h estimadas</span>
                  <span className="meta-pill">{course.category}</span>
                </div>

                {course.objectives && course.objectives.length > 0 && (
                  <ul className="catalog-objectives">
                    {course.objectives.slice(0, 2).map((obj, i) => (
                      <li key={i}><StarIcon /> {obj}</li>
                    ))}
                  </ul>
                )}

                <div className="catalog-card-actions">
                  <Link to={`/learn/courses/${course.id}`} className="secondary-button">
                    Ver detalle
                  </Link>
                  {isEnrolled ? (
                    <Link to={`/learn/courses/${course.id}`} className="primary-button">
                      {enrollment?.status === "completed" ? "Completado ✓" : "Continuar"}
                    </Link>
                  ) : (
                    <button
                      className="primary-button"
                      disabled={enrollMutation.isPending}
                      onClick={() => enrollMutation.mutate(course.id)}
                      type="button"
                    >
                      {enrollMutation.isPending ? "Inscribiendo..." : "Inscribirme"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
