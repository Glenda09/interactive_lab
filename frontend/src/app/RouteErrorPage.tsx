import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

export function RouteErrorPage() {
  const error = useRouteError();
  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Ruta no disponible";
  const description = isRouteErrorResponse(error)
    ? "La vista que intentaste abrir no existe o todavia no fue publicada."
    : "Encontramos un problema cargando esta vista.";

  return (
    <div className="route-error-shell">
      <div className="route-error-card">
        <p className="eyebrow">Navegacion protegida</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="route-error-actions">
          <Link className="primary-button route-button" to="/login">
            Ir al login
          </Link>
          <Link className="secondary-link" to="/">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
