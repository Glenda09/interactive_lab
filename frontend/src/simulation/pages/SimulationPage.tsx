import { SimulationCanvas } from "../components/SimulationCanvas";
import { useSimulationStore } from "../state/useSimulationStore";

export function SimulationPage() {
  const events = useSimulationStore((state) => state.events);
  const reset = useSimulationStore((state) => state.reset);

  return (
    <section className="page-section simulation-layout">
      <div className="simulation-panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Babylon runtime</p>
            <h2>Escenario base interactivo</h2>
          </div>
          <button className="secondary-button" onClick={reset} type="button">
            Limpiar eventos
          </button>
        </header>

        <p className="panel-copy">
          Este modulo demuestra la separacion recomendada entre shell React y escena Babylon. La
          evaluacion y el scoring aun no viven aqui; solo se emiten eventos de dominio listos para
          integrarse con backend.
        </p>

        <SimulationCanvas />
      </div>

      <aside className="event-panel">
        <h3>Eventos recientes</h3>
        <ul className="event-list">
          {events.length === 0 && <li>No hay eventos capturados todavia.</li>}
          {events.map((event) => (
            <li key={event.id}>
              <strong>{event.type}</strong>
              <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
              <p>{event.detail}</p>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}

