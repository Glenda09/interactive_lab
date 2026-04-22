import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getScenarios, ScenarioResponse } from "../../shared/lib/api/platform";
import { SimulationCanvas } from "../components/SimulationCanvas";
import { useSimulationStore } from "../state/useSimulationStore";

const DIFF_LABELS: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado"
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado"
};

function CubeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L22 7v10l-10 5L2 17V7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M2 7l10 5 10-5M12 12v10" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6.3 4.3a1 1 0 0 0-1.3.95v9.5a1 1 0 0 0 1.5.86l8-4.75a1 1 0 0 0 0-1.72l-8-4.75z" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M13 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M3 3h7l7 7-7 7-7-7V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

export function SimulationPage() {
  const [selected, setSelected] = useState<ScenarioResponse | null>(null);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const events = useSimulationStore(s => s.events);
  const reset = useSimulationStore(s => s.reset);

  const { data: scenarios = [], isLoading } = useQuery<ScenarioResponse[]>({
    queryKey: ["scenarios"],
    queryFn: () => getScenarios()
  });

  const filtered = filter === "all" ? scenarios : scenarios.filter(s => s.status === filter);

  function handleSelect(scenario: ScenarioResponse) {
    reset();
    setSelected(scenario);
  }

  if (selected) {
    return (
      <section className="sim-active-layout">
        <header className="sim-active-header">
          <button
            className="secondary-button sim-back-btn"
            onClick={() => { reset(); setSelected(null); }}
            type="button"
          >
            <ChevronLeftIcon /> Volver a escenarios
          </button>
          <div className="sim-active-meta">
            <span className="course-code">{selected.code}</span>
            <h2>{selected.title}</h2>
            <div className="sim-active-badges">
              <span className={`status-chip ${selected.status === "published" ? "is-live" : "is-draft"}`}>
                {STATUS_LABELS[selected.status] ?? selected.status}
              </span>
              <span className="meta-pill">{DIFF_LABELS[selected.difficulty] ?? selected.difficulty}</span>
              <span className="meta-pill">v{selected.version}</span>
            </div>
          </div>
        </header>

        <div className="sim-active-body">
          <div className="sim-canvas-wrapper">
            <SimulationCanvas scenario={selected} />
          </div>

          <aside className="sim-event-panel">
            <div className="sim-event-header">
              <h3>Registro de eventos</h3>
              <button className="secondary-button sm" onClick={reset} type="button">Limpiar</button>
            </div>

            {selected.description && (
              <div className="sim-scenario-desc">
                <p>{selected.description}</p>
              </div>
            )}

            {selected.tags && selected.tags.length > 0 && (
              <div className="sim-tags-row">
                <TagIcon />
                {selected.tags.map(tag => (
                  <span key={tag} className="meta-pill">{tag}</span>
                ))}
              </div>
            )}

            <ul className="event-list">
              {events.length === 0 && (
                <li className="event-empty">Interactúa con el escenario para generar eventos.</li>
              )}
              {events.map(ev => (
                <li key={ev.id} className="event-item">
                  <div className="event-item-type">{ev.type}</div>
                  <div className="event-item-detail">{ev.detail}</div>
                  <div className="event-item-time">{new Date(ev.timestamp).toLocaleTimeString()}</div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    );
  }

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
      </div>

      {isLoading && <p style={{ padding: "24px 0", color: "var(--ink-muted)" }}>Cargando escenarios...</p>}

      {!isLoading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><CubeIcon /></div>
          <p>No hay escenarios disponibles en esta categoría.</p>
        </div>
      )}

      <div className="sim-scenario-grid">
        {filtered.map(scenario => (
          <article key={scenario.id} className="sim-scenario-card">
            <div className="sim-card-preview">
              <div className="sim-card-babylon-bg">
                <div className="sim-card-cube">
                  <div className="cube-face cube-front" />
                  <div className="cube-face cube-back" />
                  <div className="cube-face cube-left" />
                  <div className="cube-face cube-right" />
                  <div className="cube-face cube-top" />
                  <div className="cube-face cube-bottom" />
                </div>
              </div>
              <span className="babylon-badge">Babylon.js 8</span>
            </div>

            <div className="sim-card-body">
              <div className="sim-card-top-row">
                <span className="course-code">{scenario.code}</span>
                <span className={`status-chip ${scenario.status === "published" ? "is-live" : "is-draft"}`}>
                  {STATUS_LABELS[scenario.status] ?? scenario.status}
                </span>
              </div>

              <h4>{scenario.title}</h4>
              <p className="sim-card-desc">{scenario.description || "Sin descripción."}</p>

              <div className="course-meta-row">
                <span className="meta-pill">v{scenario.version}</span>
                <span className="meta-pill">{DIFF_LABELS[scenario.difficulty] ?? scenario.difficulty}</span>
                {scenario.tags?.slice(0, 2).map(tag => (
                  <span key={tag} className="meta-pill">{tag}</span>
                ))}
              </div>

              <button
                className="primary-button sim-launch-btn"
                onClick={() => handleSelect(scenario)}
                type="button"
              >
                <PlayIcon /> Iniciar simulación
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
