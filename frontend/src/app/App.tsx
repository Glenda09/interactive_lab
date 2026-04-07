import { createBrowserRouter, NavLink, Outlet, RouterProvider } from "react-router-dom";
import { DashboardPage } from "../modules/dashboard/pages/DashboardPage";
import { SimulationPage } from "../simulation/pages/SimulationPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "simulation", element: <SimulationPage /> }
    ]
  }
]);

function RootLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Interactive Lab</p>
          <h1>Training Platform</h1>
          <p className="sidebar-copy">
            Base inicial para administracion academica y simulacion 3D en navegador.
          </p>
        </div>

        <nav className="nav-links" aria-label="Primary navigation">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/simulation">Simulacion 3D</NavLink>
        </nav>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export function App() {
  return <RouterProvider router={router} />;
}

