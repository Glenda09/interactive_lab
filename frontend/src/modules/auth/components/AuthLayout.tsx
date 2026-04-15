import { ReactNode } from "react";

interface AuthLayoutProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function AuthLayout({ eyebrow, title, description, children }: AuthLayoutProps) {
  return (
    <div className="auth-shell">
      <section className="auth-visual-panel">
        <div className="auth-visual-copy">
          {eyebrow && <p className="eyebrow auth-visual-eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          <p className="auth-brand-tagline">Capacita, simula y certifica con confianza.</p>
          {description && <p>{description}</p>}
        </div>
      </section>

      <section className="auth-form-panel">{children}</section>
    </div>
  );
}
