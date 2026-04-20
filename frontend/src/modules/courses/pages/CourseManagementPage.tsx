import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  CourseModuleResponse,
  CourseResponse,
  createCourse,
  deleteCourse,
  getCourses,
  getScenarios,
  updateCourse
} from "../../../shared/lib/api/platform";

const moduleSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres"),
  description: z.string().optional(),
  order: z.number().int().min(0),
  scenarioId: z.string().nullable().optional(),
  estimatedMinutes: z.number().int().min(1).optional(),
  type: z.enum(["simulation", "theory", "assessment"]).optional()
});

const courseSchema = z.object({
  code: z.string().min(2, "Ingresa el código"),
  title: z.string().min(3, "Ingresa el título"),
  description: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  estimatedHours: z.number().min(0).optional(),
  objectives: z.string().optional(),
  tags: z.string().optional()
});

type CourseFormValues = z.infer<typeof courseSchema>;

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado"
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado"
};

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="m4.5 13.8 7.9-7.9 3.1 3.1-7.9 7.9-3.5.4zM11.5 4.8l1.8-1.8a1.5 1.5 0 0 1 2.1 0l1.6 1.6a1.5 1.5 0 0 1 0 2.1l-1.8 1.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 6h12l-1.5 11H5.5ZM8 6V4h4v2M7 9v5M13 9v5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M10 2 17 6v8l-7 4-7-4V6Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 6l7 4 7-4M10 10v8" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function CourseManagementPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CourseResponse | null>(null);
  const [editingModules, setEditingModules] = useState<CourseModuleResponse[]>([]);
  const [filter, setFilter] = useState<"all" | "draft" | "published" | "archived">("all");

  const coursesQuery = useQuery({ queryKey: ["courses"], queryFn: () => getCourses() });
  const scenariosQuery = useQuery({ queryKey: ["scenarios"], queryFn: () => getScenarios() });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema)
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<CourseResponse>) => createCourse(data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["courses"] }); closeForm(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CourseResponse> }) => updateCourse(id, data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["courses"] }); closeForm(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["courses"] })
  });

  function openCreate() {
    setEditing(null);
    setEditingModules([]);
    reset({ code: "", title: "", description: "", category: "industrial", level: "beginner", status: "draft", estimatedHours: 0, objectives: "", tags: "" });
    setShowForm(true);
  }

  function openEdit(course: CourseResponse) {
    setEditing(course);
    setEditingModules(course.modules ?? []);
    reset({
      code: course.code,
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      status: course.status,
      estimatedHours: course.estimatedHours,
      objectives: course.objectives?.join(", "),
      tags: course.tags?.join(", ")
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setEditingModules([]);
  }

  function onSubmit(values: CourseFormValues) {
    const payload: Partial<CourseResponse> = {
      code: values.code,
      title: values.title,
      description: values.description,
      category: values.category,
      level: values.level,
      status: values.status,
      estimatedHours: values.estimatedHours,
      objectives: values.objectives ? values.objectives.split(",").map(s => s.trim()).filter(Boolean) : [],
      tags: values.tags ? values.tags.split(",").map(s => s.trim()).filter(Boolean) : [],
      modules: editingModules
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function addModule() {
    setEditingModules(prev => [
      ...prev,
      { title: "Nuevo módulo", description: "", order: prev.length, scenarioId: null, estimatedMinutes: 30, type: "simulation" }
    ]);
  }

  function removeModule(idx: number) {
    setEditingModules(prev => prev.filter((_, i) => i !== idx).map((m, i) => ({ ...m, order: i })));
  }

  function updateModule(idx: number, field: keyof CourseModuleResponse, value: string | number | null) {
    setEditingModules(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  }

  const courses = coursesQuery.data ?? [];
  const filtered = filter === "all" ? courses : courses.filter(c => c.status === filter);
  const scenarios = scenariosQuery.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <section className="page-section admin-dashboard">
      <header className="admin-hero-card">
        <div className="admin-hero-copy">
          <p className="eyebrow">Gestión académica</p>
          <h2>Catálogo de cursos de capacitación 3D</h2>
          <p>Administra los cursos de la plataforma, sus módulos y escenarios de simulación Babylon.js asociados.</p>
        </div>
        <aside className="hero-side-panel">
          <div className="hero-side-header">
            <p className="eyebrow">Estadísticas</p>
          </div>
          <div className="hero-side-meta">
            <span>Total de cursos</span>
            <strong>{courses.length}</strong>
          </div>
          <div className="hero-side-meta">
            <span>Publicados</span>
            <strong>{courses.filter(c => c.status === "published").length}</strong>
          </div>
          <div className="hero-side-meta">
            <span>En borrador</span>
            <strong>{courses.filter(c => c.status === "draft").length}</strong>
          </div>
        </aside>
      </header>

      <div className="admin-toolbar">
        <div className="filter-tabs">
          {(["all", "published", "draft", "archived"] as const).map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? "is-active" : ""}`}
              onClick={() => setFilter(f)}
              type="button"
            >
              {f === "all" ? "Todos" : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
        <button className="primary-button" onClick={openCreate} type="button">
          <PlusIcon /> Nuevo curso
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-panel modal-wide">
            <div className="modal-header">
              <h3>{editing ? "Editar curso" : "Nuevo curso"}</h3>
              <button className="modal-close" onClick={closeForm} type="button">✕</button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="form-grid-2">
                <div className="field-group">
                  <label>Código *</label>
                  <input placeholder="ELEC-BAS-001" {...register("code")} />
                  {errors.code && <span className="field-error">{errors.code.message}</span>}
                </div>
                <div className="field-group">
                  <label>Título *</label>
                  <input placeholder="Operación segura de panel eléctrico" {...register("title")} />
                  {errors.title && <span className="field-error">{errors.title.message}</span>}
                </div>
              </div>

              <div className="field-group">
                <label>Descripción</label>
                <textarea placeholder="Descripción detallada del curso..." rows={3} {...register("description")} />
              </div>

              <div className="form-grid-3">
                <div className="field-group">
                  <label>Categoría</label>
                  <input placeholder="industrial" {...register("category")} />
                </div>
                <div className="field-group">
                  <label>Nivel</label>
                  <select {...register("level")}>
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </div>
                <div className="field-group">
                  <label>Estado</label>
                  <select {...register("status")}>
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Archivado</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="field-group">
                  <label>Duración estimada (horas)</label>
                  <input type="number" min="0" step="0.5" {...register("estimatedHours", { valueAsNumber: true })} />
                </div>
                <div className="field-group">
                  <label>Tags (separados por coma)</label>
                  <input placeholder="eléctrico, seguridad, industrial" {...register("tags")} />
                </div>
              </div>

              <div className="field-group">
                <label>Objetivos (separados por coma)</label>
                <input placeholder="Identificar riesgos, Aplicar protocolo..." {...register("objectives")} />
              </div>

              <div className="modules-editor">
                <div className="modules-editor-header">
                  <div>
                    <p className="eyebrow">Contenido del curso</p>
                    <h4>Módulos ({editingModules.length})</h4>
                  </div>
                  <button className="secondary-button sm" onClick={addModule} type="button">
                    <PlusIcon /> Agregar módulo
                  </button>
                </div>

                {editingModules.length === 0 && (
                  <p className="empty-hint">Sin módulos. Agrega el primero para estructurar el contenido.</p>
                )}

                {editingModules.map((mod, idx) => (
                  <div key={idx} className="module-item">
                    <div className="module-item-number">{idx + 1}</div>
                    <div className="module-item-fields">
                      <div className="form-grid-2">
                        <div className="field-group">
                          <label>Título del módulo</label>
                          <input
                            value={mod.title}
                            onChange={e => updateModule(idx, "title", e.target.value)}
                            placeholder="Inspección inicial del panel"
                          />
                        </div>
                        <div className="field-group">
                          <label>Tipo</label>
                          <select value={mod.type} onChange={e => updateModule(idx, "type", e.target.value)}>
                            <option value="simulation">Simulación 3D</option>
                            <option value="theory">Contenido teórico</option>
                            <option value="assessment">Evaluación</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-grid-2">
                        <div className="field-group">
                          <label>Escenario 3D</label>
                          <select
                            value={mod.scenarioId ?? ""}
                            onChange={e => updateModule(idx, "scenarioId", e.target.value || null)}
                          >
                            <option value="">Sin escenario</option>
                            {scenarios.map(s => (
                              <option key={s.id} value={s.id}>{s.title}</option>
                            ))}
                          </select>
                        </div>
                        <div className="field-group">
                          <label>Duración (min)</label>
                          <input
                            type="number"
                            min="1"
                            value={mod.estimatedMinutes}
                            onChange={e => updateModule(idx, "estimatedMinutes", Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="field-group">
                        <label>Descripción del módulo</label>
                        <input
                          value={mod.description}
                          onChange={e => updateModule(idx, "description", e.target.value)}
                          placeholder="Descripción breve del módulo..."
                        />
                      </div>
                    </div>
                    <button className="icon-btn danger" onClick={() => removeModule(idx)} type="button" title="Eliminar módulo">
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button className="secondary-button" onClick={closeForm} type="button">Cancelar</button>
                <button className="primary-button" disabled={isPending} type="submit">
                  {isPending ? "Guardando..." : editing ? "Guardar cambios" : "Crear curso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <article className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Catálogo de cursos</p>
            <h3>Todos los cursos ({filtered.length})</h3>
          </div>
        </div>

        {coursesQuery.isLoading && <p>Cargando cursos...</p>}
        {coursesQuery.isError && <p className="error-text">Error al cargar los cursos. Verifica la conexión con el backend.</p>}

        {filtered.length === 0 && !coursesQuery.isLoading && (
          <div className="empty-state">
            <div className="empty-state-icon"><CubeIcon /></div>
            <p>No hay cursos en esta categoría.</p>
            <button className="primary-button" onClick={openCreate} type="button">Crear primer curso</button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="course-cards-grid">
            {filtered.map(course => (
              <article key={course.id} className="course-admin-card">
                <div className="course-admin-card-header">
                  <div>
                    <span className="course-code">{course.code}</span>
                    <h4>{course.title}</h4>
                  </div>
                  <span className={`status-chip ${course.status === "published" ? "is-live" : course.status === "archived" ? "is-disabled" : "is-draft"}`}>
                    {STATUS_LABELS[course.status] ?? course.status}
                  </span>
                </div>

                <p className="course-description">{course.description || "Sin descripción."}</p>

                <div className="course-meta-row">
                  <span className="meta-pill">{LEVEL_LABELS[course.level] ?? course.level}</span>
                  <span className="meta-pill">{course.category}</span>
                  <span className="meta-pill">{course.estimatedHours}h estimadas</span>
                  <span className="meta-pill">{course.modules?.length ?? 0} módulos</span>
                </div>

                {course.modules && course.modules.length > 0 && (
                  <ul className="module-mini-list">
                    {course.modules.slice(0, 3).map((m, i) => (
                      <li key={i}>
                        <span className={`module-type-badge ${m.type}`}>
                          {m.type === "simulation" ? "3D" : m.type === "theory" ? "Teoría" : "Eval"}
                        </span>
                        <span>{m.title}</span>
                        <span className="module-duration">{m.estimatedMinutes} min</span>
                      </li>
                    ))}
                    {course.modules.length > 3 && (
                      <li className="module-more">+{course.modules.length - 3} módulos más</li>
                    )}
                  </ul>
                )}

                <div className="course-admin-card-actions">
                  <button className="secondary-button sm" onClick={() => openEdit(course)} type="button">
                    <EditIcon /> Editar
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() => { if (confirm(`¿Eliminar "${course.title}"?`)) deleteMutation.mutate(course.id); }}
                    type="button"
                    title="Eliminar curso"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
