import { useQuery } from "@tanstack/react-query";
import { getHealthCheck } from "../../../shared/lib/api/platform";

const summaryCards = [
  { label: "Cursos activos", value: "12", detail: "Catalogo inicial para operaciones tecnicas" },
  { label: "Escenarios 3D", value: "8", detail: "Versionados y listos para publicacion" },
  { label: "Roles base", value: "7", detail: "RBAC propuesto para v1" }
];

export function DashboardPage() {
  const healthQuery = useQuery({
    queryKey: ["platform-health"],
    queryFn: getHealthCheck
  });

  return (
    <section className="page-section">
      <header className="hero-card">
        <p className="eyebrow">Arquitectura viva</p>
        <h2>Base de frontend preparada para operar con la API modular</h2>
        <p>
          Este shell ya separa navegacion, cliente HTTP y runtime de simulacion para que la
          aplicacion crezca sin mezclar UI administrativa con Babylon.js.
        </p>
      </header>

      <div className="card-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="metric-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </div>

      <article className="status-card">
        <div>
          <p className="eyebrow">Backend status</p>
          <h3>Conectividad base</h3>
        </div>

        {healthQuery.isLoading && <p>Consultando servicio backend...</p>}
        {healthQuery.isError && (
          <p>
            No fue posible consultar la API. El frontend queda listo para usar proxy local a
            `http://localhost:3000`.
          </p>
        )}
        {healthQuery.data && (
          <dl className="status-list">
            <div>
              <dt>Estado</dt>
              <dd>{healthQuery.data.status}</dd>
            </div>
            <div>
              <dt>Servicio</dt>
              <dd>{healthQuery.data.service}</dd>
            </div>
            <div>
              <dt>Timestamp</dt>
              <dd>{new Date(healthQuery.data.timestamp).toLocaleString()}</dd>
            </div>
          </dl>
        )}
      </article>
    </section>
  );
}

