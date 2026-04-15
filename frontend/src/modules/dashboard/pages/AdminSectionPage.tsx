type SectionHighlight = {
  label: string;
  detail: string;
};

type AdminSectionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: SectionHighlight[];
};

export function AdminSectionPage({
  eyebrow,
  title,
  description,
  highlights
}: AdminSectionPageProps) {
  return (
    <section className="page-section admin-dashboard">
      <header className="admin-hero-card">
        <div className="admin-hero-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <aside className="hero-side-panel">
          <div className="hero-side-header">
            <p className="eyebrow">Enfoque actual</p>
            <span className="status-chip is-live">Activo</span>
          </div>
          <strong>Bloque administrativo</strong>
          <p>La seccion ya esta registrada dentro del shell principal de la plataforma.</p>
          <div className="hero-side-meta">
            <span>Frentes listados</span>
            <strong>{highlights.length}</strong>
          </div>
        </aside>
      </header>

      <div className="admin-summary-grid">
        {highlights.map((item) => (
          <article key={item.label} className="admin-summary-card">
            <span>{item.label}</span>
            <strong>01</strong>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>

      <article className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Hoja de trabajo</p>
            <h3>Proximos pasos de la seccion</h3>
          </div>
        </div>

        <ul className="governance-list">
          {highlights.map((item) => (
            <li key={`${item.label}-task`}>
              <div>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </div>
              <span className="status-chip is-neutral">pendiente</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
