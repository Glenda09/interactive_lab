import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ScenarioResponse,
  createScenario,
  deleteScenario,
  getScenarios,
  updateScenario
} from "../../../shared/lib/api/platform";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { ModalPortal } from "../../../shared/components/ModalPortal";

const schema = z.object({
  code: z.string().min(2, "Ingresa el código"),
  title: z.string().min(3, "Ingresa el título"),
  description: z.string().optional(),
  version: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  tags: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

const STATUS_LABELS: Record<string, string> = { draft: "Borrador", published: "Publicado", archived: "Archivado" };
const DIFF_LABELS: Record<string, string> = { beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado" };

function EditIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m4.5 13.8 7.9-7.9 3.1 3.1-7.9 7.9-3.5.4zM11.5 4.8l1.8-1.8a1.5 1.5 0 0 1 2.1 0l1.6 1.6a1.5 1.5 0 0 1 0 2.1l-1.8 1.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" /></svg>;
}
function TrashIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 6h12l-1.5 11H5.5ZM8 6V4h4v2M7 9v5M13 9v5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" /></svg>;
}
function PlusIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>;
}
function SceneIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M10 2 17 6v8l-7 4-7-4V6Z" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M3 6l7 4 7-4M10 10v8" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>;
}

export function ScenarioManagementPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScenarioResponse | null>(null);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ScenarioResponse | null>(null);

  const scenariosQuery = useQuery({ queryKey: ["scenarios"], queryFn: () => getScenarios() });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  function extractErrorMessage(err: unknown): string {
    if (err && typeof err === "object" && "response" in err) {
      const res = (err as { response?: { data?: { message?: string } } }).response;
      if (res?.data?.message) return res.data.message;
    }
    return "Ocurrió un error al guardar el escenario.";
  }

  const createMutation = useMutation({
    mutationFn: (data: Partial<ScenarioResponse>) => createScenario(data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["scenarios"] }); closeForm(); },
    onError: (err: unknown) => { setMutationError(extractErrorMessage(err)); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScenarioResponse> }) => updateScenario(id, data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["scenarios"] }); closeForm(); },
    onError: (err: unknown) => { setMutationError(extractErrorMessage(err)); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteScenario(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["scenarios"] })
  });

  function openCreate() {
    setEditing(null);
    setMutationError(null);
    reset({ code: "", title: "", description: "", version: "1.0.0", status: "draft", difficulty: "beginner", tags: "" });
    setShowForm(true);
  }

  function openEdit(s: ScenarioResponse) {
    setEditing(s);
    setMutationError(null);
    reset({ code: s.code, title: s.title, description: s.description, version: s.version, status: s.status, difficulty: s.difficulty, tags: s.tags?.join(", ") });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditing(null); setMutationError(null); }

  function onSubmit(values: FormValues) {
    const payload: Partial<ScenarioResponse> = {
      ...values,
      tags: values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : []
    };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  }

  const scenarios = scenariosQuery.data ?? [];
  const filtered = filter === "all" ? scenarios : scenarios.filter(s => s.status === filter);
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <section className="page-section admin-dashboard">

      <div className="admin-toolbar">
        <div className="filter-tabs">
          {(["all", "published", "draft"] as const).map(f => (
            <button key={f} className={`filter-tab ${filter === f ? "is-active" : ""}`} onClick={() => setFilter(f)} type="button">
              {f === "all" ? "Todos" : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
        <button className="primary-button" onClick={openCreate} type="button">
          <PlusIcon /> Nuevo escenario
        </button>
      </div>

      {showForm && (
        <ModalPortal>
        <div className="modal-overlay">
          <div className="modal-panel">
            <div className="modal-header">
              <h3>{editing ? "Editar escenario" : "Nuevo escenario"}</h3>
              <button className="modal-close" onClick={closeForm} type="button">✕</button>
            </div>
            <form className="admin-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="form-grid-2">
                <div className="field-group">
                  <label>Código *</label>
                  <input placeholder="SCN-PANEL-001" {...register("code")} />
                  {errors.code && <span className="field-error">{errors.code.message}</span>}
                </div>
                <div className="field-group">
                  <label>Versión</label>
                  <input placeholder="1.0.0" {...register("version")} />
                </div>
              </div>
              <div className="field-group">
                <label>Título *</label>
                <input placeholder="Inspección inicial de panel eléctrico" {...register("title")} />
                {errors.title && <span className="field-error">{errors.title.message}</span>}
              </div>
              <div className="field-group">
                <label>Descripción</label>
                <textarea rows={3} placeholder="Descripción del escenario 3D..." {...register("description")} />
              </div>
              <div className="form-grid-3">
                <div className="field-group">
                  <label>Estado</label>
                  <select {...register("status")}>
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Archivado</option>
                  </select>
                </div>
                <div className="field-group">
                  <label>Dificultad</label>
                  <select {...register("difficulty")}>
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </div>
                <div className="field-group">
                  <label>Tags</label>
                  <input placeholder="eléctrico, panel, seguridad" {...register("tags")} />
                </div>
              </div>
              {mutationError && (
                <div className="form-message is-error">{mutationError}</div>
              )}
              <div className="modal-actions">
                <button className="secondary-button" onClick={closeForm} type="button">Cancelar</button>
                <button className="primary-button" disabled={isPending} type="submit">
                  {isPending ? "Guardando..." : editing ? "Guardar cambios" : "Crear escenario"}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      <div className="scenario-cards-grid">
        {scenariosQuery.isLoading && <p>Cargando escenarios...</p>}
        {filtered.length === 0 && !scenariosQuery.isLoading && (
          <div className="empty-state">
            <div className="empty-state-icon"><SceneIcon /></div>
            <p>No hay escenarios en esta categoría.</p>
            <button className="primary-button" onClick={openCreate} type="button">Crear primer escenario</button>
          </div>
        )}
        {filtered.map(s => (
          <article key={s.id} className="scenario-card">
            <div className="scenario-card-3d-preview">
              <SceneIcon />
              <span className="babylon-badge">Babylon.js 8</span>
            </div>
            <div className="scenario-card-body">
              <div className="scenario-card-header">
                <span className="course-code">{s.code}</span>
                <span className={`status-chip ${s.status === "published" ? "is-live" : "is-draft"}`}>
                  {STATUS_LABELS[s.status] ?? s.status}
                </span>
              </div>
              <h4>{s.title}</h4>
              <p>{s.description || "Sin descripción."}</p>
              <div className="course-meta-row">
                <span className="meta-pill">v{s.version}</span>
                <span className="meta-pill">{DIFF_LABELS[s.difficulty]}</span>
                {s.tags?.slice(0, 2).map(tag => <span key={tag} className="meta-pill">{tag}</span>)}
              </div>
              <div className="course-admin-card-actions">
                <button className="secondary-button sm" onClick={() => openEdit(s)} type="button"><EditIcon /> Editar</button>
                <button
                  className="icon-btn danger"
                  onClick={() => setConfirmDelete(s)}
                  title="Eliminar"
                  type="button"
                ><TrashIcon /></button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Eliminar escenario"
        message={`¿Estás seguro de que deseas eliminar "${confirmDelete?.title}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={() => { if (confirmDelete) deleteMutation.mutate(confirmDelete.id); setConfirmDelete(null); }}
        onCancel={() => setConfirmDelete(null)}
      />
    </section>
  );
}
