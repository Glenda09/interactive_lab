import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getCourses, getMyEnrollments, getMyProgress } from "../../../shared/lib/api/platform";
import { useAuthStore } from "../../auth/state/useAuthStore";

export function StudentProfilePage() {
  const user = useAuthStore(s => s.user);
  const enrollmentsQuery = useQuery({ queryKey: ["my-enrollments"], queryFn: getMyEnrollments });
  const progressQuery = useQuery({ queryKey: ["my-progress"], queryFn: getMyProgress });
  const coursesQuery = useQuery({ queryKey: ["courses-published"], queryFn: () => getCourses(true) });

  const enrollments = enrollmentsQuery.data ?? [];
  const allProgress = progressQuery.data ?? [];
  const courses = coursesQuery.data ?? [];

  const completedCourses = enrollments.filter(e => e.status === "completed").length;
  const totalModulesCompleted = allProgress.reduce((acc, p) => acc + p.modules.filter(m => m.status === "completed").length, 0);
  const avgProgress = allProgress.length > 0 ? Math.round(allProgress.reduce((acc, p) => acc + p.progressPct, 0) / allProgress.length) : 0;

  return (
    <section className="page-section learn-dashboard">
      <div className="profile-hero">
        <div className="profile-avatar-lg">{user?.email.charAt(0).toUpperCase()}</div>
        <div className="profile-hero-info">
          <h2>{user?.email.split("@")[0]}</h2>
          <p>{user?.email}</p>
          <div className="course-meta-row">
            {user?.roles.map(role => <span key={role} className="meta-pill">{role}</span>)}
          </div>
        </div>
        <Link to="/change-password" className="secondary-button">Cambiar contraseña</Link>
      </div>

      <div className="admin-summary-grid" style={{ marginTop: 24 }}>
        {[
          { label: "Cursos inscritos", value: enrollments.length },
          { label: "Cursos completados", value: completedCourses },
          { label: "Módulos completados", value: totalModulesCompleted },
          { label: "Progreso promedio", value: `${avgProgress}%` }
        ].map(card => (
          <article key={card.label} className="admin-summary-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      {allProgress.length > 0 && (
        <article className="admin-panel" style={{ marginTop: 24 }}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Mi progreso</p>
              <h3>Avance por curso</h3>
            </div>
          </div>
          <ul className="report-course-list">
            {allProgress.map(p => {
              const course = courses.find(c => c.id === p.courseId);
              return (
                <li key={p.id} className="report-course-item">
                  <div className="report-course-info">
                    <span className="course-code sm">{course?.code ?? p.courseId.slice(-6)}</span>
                    <strong>{course?.title ?? "Curso"}</strong>
                  </div>
                  <div className="report-course-stats">
                    <span>{p.modules.filter(m => m.status === "completed").length}/{p.modules.length} módulos</span>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar" style={{ width: `${p.progressPct}%` }} />
                    </div>
                    <span className="progress-pct">{p.progressPct}%</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      )}
    </section>
  );
}
