import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEnrollment,
  deleteEnrollment,
  EnrollmentResponse,
  getCourses,
  getEnrollments,
  getUsers,
  updateEnrollment
} from "../../../shared/lib/api/platform";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { ModalPortal } from "../../../shared/components/ModalPortal";

const STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  completed: "Completada",
  dropped: "Abandono",
  suspended: "Suspendida"
};

function PlusIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>;
}
function TrashIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 6h12l-1.5 11H5.5ZM8 6V4h4v2M7 9v5M13 9v5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" /></svg>;
}

export function EnrollmentManagementPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed" | "dropped">("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<EnrollmentResponse | null>(null);

  const enrollmentsQuery = useQuery({ queryKey: ["enrollments"], queryFn: () => getEnrollments() });
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: () => getUsers() });
  const coursesQuery = useQuery({ queryKey: ["courses"], queryFn: () => getCourses() });

  const createMutation = useMutation({
    mutationFn: () => createEnrollment({ userId: selectedUserId, courseId: selectedCourseId, notes }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["enrollments"] }); closeForm(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateEnrollment(id, { status }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["enrollments"] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEnrollment(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["enrollments"] })
  });

  function closeForm() {
    setShowForm(false);
    setSelectedUserId("");
    setSelectedCourseId("");
    setNotes("");
  }

  const enrollments = enrollmentsQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const courses = coursesQuery.data ?? [];

  const filtered = filterStatus === "all"
    ? enrollments
    : enrollments.filter(e => e.status === filterStatus);

  function getUserName(userId: string) {
    return users.find(u => u.id === userId)?.fullName ?? userId.slice(-8);
  }

  function getCourseName(courseId: string) {
    return courses.find(c => c.id === courseId)?.title ?? courseId.slice(-8);
  }

  function getCourseCode(courseId: string) {
    return courses.find(c => c.id === courseId)?.code ?? "—";
  }

  return (
    <section className="page-section admin-dashboard">

      <div className="admin-toolbar">
        <div className="filter-tabs">
          {(["all", "active", "completed", "dropped"] as const).map(f => (
            <button key={f} className={`filter-tab ${filterStatus === f ? "is-active" : ""}`} onClick={() => setFilterStatus(f)} type="button">
              {f === "all" ? "Todas" : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
        <button className="primary-button" onClick={() => setShowForm(true)} type="button">
          <PlusIcon /> Inscribir usuario
        </button>
      </div>

      {showForm && (
        <ModalPortal>
        <div className="modal-overlay">
          <div className="modal-panel">
            <div className="modal-header">
              <h3>Nueva inscripción</h3>
              <button className="modal-close" onClick={closeForm} type="button">✕</button>
            </div>
            <div className="admin-form">
              <div className="field-group">
                <label>Usuario *</label>
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                  <option value="">Seleccionar usuario...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName} — {u.email}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label>Curso *</label>
                <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                  <option value="">Seleccionar curso...</option>
                  {courses.filter(c => c.status === "published").map(c => (
                    <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label>Notas administrativas</label>
                <textarea
                  rows={3}
                  placeholder="Información adicional sobre la inscripción..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button className="secondary-button" onClick={closeForm} type="button">Cancelar</button>
                <button
                  className="primary-button"
                  disabled={!selectedUserId || !selectedCourseId || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                  type="button"
                >
                  {createMutation.isPending ? "Inscribiendo..." : "Inscribir"}
                </button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      <article className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Registro de inscripciones</p>
            <h3>Inscripciones ({filtered.length})</h3>
          </div>
        </div>

        {enrollmentsQuery.isLoading && <p>Cargando inscripciones...</p>}

        {filtered.length === 0 && !enrollmentsQuery.isLoading && (
          <div className="empty-state">
            <p>No hay inscripciones en esta categoría.</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="enrollment-table">
            <div className="enrollment-table-head">
              <span>Estudiante</span>
              <span>Curso</span>
              <span>Estado</span>
              <span>Inscrito el</span>
              <span>Acciones</span>
            </div>
            {filtered.map(e => (
              <div key={e.id} className="enrollment-table-row">
                <div className="enrollment-user">
                  <div className="user-avatar sm">{getUserName(e.userId).charAt(0).toUpperCase()}</div>
                  <span>{getUserName(e.userId)}</span>
                </div>
                <div className="enrollment-course">
                  <span className="course-code sm">{getCourseCode(e.courseId)}</span>
                  <span>{getCourseName(e.courseId)}</span>
                </div>
                <div>
                  <span className={`status-chip ${
                    e.status === "active" ? "is-live"
                    : e.status === "completed" ? "is-success"
                    : "is-disabled"
                  }`}>
                    {STATUS_LABELS[e.status] ?? e.status}
                  </span>
                </div>
                <div className="enrollment-date">
                  {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "—"}
                </div>
                <div className="enrollment-actions">
                  {e.status === "active" && (
                    <>
                      <button
                        className="secondary-button sm"
                        onClick={() => updateMutation.mutate({ id: e.id, status: "completed" })}
                        type="button"
                      >
                        Completar
                      </button>
                      <button
                        className="secondary-button sm"
                        onClick={() => updateMutation.mutate({ id: e.id, status: "dropped" })}
                        type="button"
                      >
                        Abandono
                      </button>
                    </>
                  )}
                  {e.status !== "active" && (
                    <button
                      className="secondary-button sm"
                      onClick={() => updateMutation.mutate({ id: e.id, status: "active" })}
                      type="button"
                    >
                      Reactivar
                    </button>
                  )}
                  <button
                    className="icon-btn danger"
                    onClick={() => setConfirmDelete(e)}
                    title="Eliminar"
                    type="button"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Eliminar inscripción"
        message="¿Estás seguro de que deseas eliminar esta inscripción? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => { if (confirmDelete) deleteMutation.mutate(confirmDelete.id); setConfirmDelete(null); }}
        onCancel={() => setConfirmDelete(null)}
      />
    </section>
  );
}
