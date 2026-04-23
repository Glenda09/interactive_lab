import { useRef, useState, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ScenarioResponse,
  ScenarioAnalysisResult,
  SceneType,
  createScenario,
  deleteScenario,
  getScenarios,
  updateScenario,
  uploadImage,
  analyzeScenarioImage
} from "../../../shared/lib/api/platform";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { ModalPortal } from "../../../shared/components/ModalPortal";
import { SimulationCanvas } from "../../../simulation/components/SimulationCanvas";

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
const SCENE_LABELS: Record<SceneType, string> = {
  electrical_panel: "Panel Eléctrico",
  irrigation_drip: "Riego por Goteo",
  sprinkler: "Aspersor",
  water_cycle: "Ciclo del Agua",
  comparative: "Comparativo",
  default: "General",
  custom: "Escena Personalizada"
};

const SCENE_TYPE_TO_TAGS: Record<SceneType, string[]> = {
  electrical_panel: ["eléctrico", "panel"],
  irrigation_drip: ["riego", "goteo"],
  sprinkler: ["riego", "aspersor"],
  water_cycle: ["agua", "ciclo"],
  comparative: ["comparativo", "riego"],
  default: [],
  custom: []
};

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
function ImageIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><rect x="2" y="4" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="7" cy="8" r="1.5" fill="currentColor" /><path d="M2 14l4-4 3 3 3-4 4 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" /></svg>;
}
function SparkleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M10 2v3M10 15v3M2 10h3M15 10h3M4.22 4.22l2.12 2.12M13.66 13.66l2.12 2.12M4.22 15.78l2.12-2.12M13.66 6.34l2.12-2.12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><circle cx="10" cy="10" r="2.5" fill="currentColor" /></svg>;
}

export function ScenarioManagementPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScenarioResponse | null>(null);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ScenarioResponse | null>(null);

  // Image analysis state
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ScenarioAnalysisResult | null>(null);
  const [babylonConfigOverride, setBabylonConfigOverride] = useState<Record<string, unknown> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    resetImageState();
    reset({ code: "", title: "", description: "", version: "1.0.0", status: "draft", difficulty: "beginner", tags: "" });
    setShowForm(true);
  }

  function openEdit(s: ScenarioResponse) {
    setEditing(s);
    setMutationError(null);
    setReferenceImageUrl(s.thumbnailUrl);
    setAnalysisResult(null);
    setBabylonConfigOverride(null);
    setImageError(null);
    reset({ code: s.code, title: s.title, description: s.description, version: s.version, status: s.status, difficulty: s.difficulty, tags: s.tags?.join(", ") });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setMutationError(null);
    resetImageState();
  }

  function resetImageState() {
    setReferenceImageUrl(null);
    setAnalysisResult(null);
    setBabylonConfigOverride(null);
    setIsUploading(false);
    setIsAnalyzing(false);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    setAnalysisResult(null);
    setBabylonConfigOverride(null);
    setIsUploading(true);
    try {
      const { url } = await uploadImage(file);
      setReferenceImageUrl(url);
    } catch {
      setImageError("Error al subir la imagen. Intenta de nuevo.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAnalyze() {
    if (!referenceImageUrl) return;
    setIsAnalyzing(true);
    setImageError(null);
    try {
      const result = await analyzeScenarioImage(referenceImageUrl);
      setAnalysisResult(result);
    } catch {
      setImageError("Error al analizar la imagen con IA. Verifica la conexión con Ollama.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function applyAnalysis() {
    if (!analysisResult) return;
    setBabylonConfigOverride(analysisResult.babylonConfig);
  }

  // Temporary scenario object for the 3D preview — maps sceneType to code/tags that detectSceneType() understands
  const previewScenario = useMemo<ScenarioResponse | undefined>(() => {
    if (!analysisResult) return undefined;
    const st = analysisResult.sceneType;
    return {
      id: "preview",
      code: st === "electrical_panel" ? "SCN-PANEL-001"
        : st === "irrigation_drip" ? "SCN-RIEGO-001"
        : st === "sprinkler" ? "SCN-ASPERSOR-001"
        : st === "water_cycle" ? "SCN-AGUA-001"
        : st === "comparative" ? "SCN-COMP-001"
        : "SCN-DEFAULT-001",
      title: SCENE_LABELS[st],
      description: analysisResult.description,
      version: "1.0.0",
      status: "draft",
      thumbnailUrl: null,
      difficulty: "beginner",
      tags: SCENE_TYPE_TO_TAGS[st],
      babylonConfig: analysisResult.babylonConfig,
      createdBy: null,
      createdAt: null,
      updatedAt: null
    };
  }, [analysisResult]);

  function onSubmit(values: FormValues) {
    const payload: Partial<ScenarioResponse> = {
      ...values,
      tags: values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      thumbnailUrl: referenceImageUrl ?? editing?.thumbnailUrl ?? null,
      babylonConfig: babylonConfigOverride ?? editing?.babylonConfig ?? {}
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
          <div className="modal-panel modal-panel--wide">
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

              {/* ── Imagen de referencia + análisis IA ── */}
              <div className="field-group">
                <label>Imagen de referencia</label>
                <div className="image-upload-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    className="secondary-button sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <ImageIcon />
                    {isUploading ? "Subiendo..." : referenceImageUrl ? "Cambiar imagen" : "Seleccionar imagen"}
                  </button>

                  {referenceImageUrl && (
                    <button
                      type="button"
                      className="primary-button sm"
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                    >
                      <SparkleIcon />
                      {isAnalyzing ? "Analizando..." : "Analizar con IA"}
                    </button>
                  )}
                </div>

                {referenceImageUrl && (
                  <div className="image-preview-strip">
                    <img src={referenceImageUrl} alt="Referencia" className="image-preview-thumb" />
                    {babylonConfigOverride && (
                      <span className="meta-pill is-success">Configuración 3D aplicada</span>
                    )}
                  </div>
                )}

                {imageError && <span className="field-error">{imageError}</span>}
              </div>

              {/* ── Panel de resultado IA ── */}
              {analysisResult && (
                <div className="ai-analysis-panel">
                  <div className="ai-analysis-header">
                    <SparkleIcon />
                    <span>Resultado del análisis</span>
                  </div>
                  <div className="ai-analysis-body">
                    <div className="ai-analysis-meta">
                      <div className="ai-meta-row">
                        <span className="ai-label">Tipo detectado</span>
                        <span className="meta-pill">{SCENE_LABELS[analysisResult.sceneType]}</span>
                      </div>
                      <div className="ai-meta-row">
                        <span className="ai-label">Confianza</span>
                        <span className="meta-pill">{Math.round(analysisResult.confidence * 100)}%</span>
                      </div>
                      <div className="ai-meta-row">
                        <span className="ai-label">Descripción</span>
                        <span className="ai-description">{analysisResult.description}</span>
                      </div>
                      <button
                        type="button"
                        className="primary-button sm"
                        onClick={applyAnalysis}
                        disabled={!!babylonConfigOverride}
                      >
                        {babylonConfigOverride ? "Configuración aplicada" : "Usar esta configuración"}
                      </button>
                    </div>
                    {previewScenario && (
                      <div className="ai-3d-preview">
                        <span className="ai-preview-label">Preview 3D</span>
                        <div className="ai-canvas-wrapper">
                          <SimulationCanvas scenario={previewScenario} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
              {s.thumbnailUrl ? (
                <img src={s.thumbnailUrl} alt={s.title} className="scenario-card-thumbnail" />
              ) : (
                <SceneIcon />
              )}
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
