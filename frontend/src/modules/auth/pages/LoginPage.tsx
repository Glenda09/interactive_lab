import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { PlatformLogo } from "../components/PlatformLogo";
import { loginRequest } from "../lib/auth-api";
import { useAuthStore } from "../state/useAuthStore";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo valido."),
  password: z.string().min(8, "Ingresa tu contrasena.")
});

type LoginFormValues = z.infer<typeof loginSchema>;

const ADMIN_ROLES = ["platform_admin", "instructor", "supervisor"];

function isAdminUser(roles: string[]) {
  return roles.some(r => ADMIN_ROLES.includes(r));
}

function EyeOpenIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M2 12c.8-1.7 4.8-6 10-6s9.2 4.3 10 6c-.8 1.7-4.8 6-10 6S2.8 13.7 2 12Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="12" cy="12" fill="none" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3 5.5 19 21.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M10.7 6.2A10.9 10.9 0 0 1 12 6c5.2 0 9.2 4.3 10 6-.5 1-2 3.1-4.3 4.7M14.8 14.9A3.2 3.2 0 0 1 9.1 10" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M6.5 8A15 15 0 0 0 2 12c.8 1.7 4.8 6 10 6 1.4 0 2.6-.2 3.8-.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function EmployeeVisualPanel() {
  return (
    <section className="auth-visual-panel auth-visual-employee">
      <div className="auth-visual-copy">
        <h1>Interactive Lab Platform</h1>
        <p className="auth-brand-tagline">Capacita, simula y certifica con confianza.</p>
      </div>
    </section>
  );
}

function StudentVisualPanel() {
  return (
    <section className="auth-visual-panel auth-visual-student">
      <div className="student-visual-bg">
        <div className="student-particle student-particle-1" />
        <div className="student-particle student-particle-2" />
        <div className="student-particle student-particle-3" />
        <div className="student-particle student-particle-4" />
        <div className="student-particle student-particle-5" />
        <div className="student-particle student-particle-6" />
      </div>

      <div className="student-3d-scene">
        <div className="student-cube">
          <div className="cube-face cube-front" />
          <div className="cube-face cube-back" />
          <div className="cube-face cube-left" />
          <div className="cube-face cube-right" />
          <div className="cube-face cube-top" />
          <div className="cube-face cube-bottom" />
        </div>
        <div className="student-orbit student-orbit-1">
          <div className="orbit-dot" />
        </div>
        <div className="student-orbit student-orbit-2">
          <div className="orbit-dot" />
        </div>
      </div>

      <div className="auth-visual-copy student-copy">
        <h1>Aprende con Simulación 3D</h1>
        <p className="auth-brand-tagline student-tagline">Explora, practica y certifica.</p>
        <div className="student-features">
          <div className="student-feature">
            <span className="student-feature-dot" />
            Escenarios industriales interactivos
          </div>
          <div className="student-feature">
            <span className="student-feature-dot" />
            Progreso en tiempo real
          </div>
          <div className="student-feature">
            <span className="student-feature-dot" />
            Simulaciones con tecnología 3D
          </div>
        </div>
      </div>
    </section>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const flashMessage =
    typeof location.state?.flashMessage === "string" ? location.state.flashMessage : null;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loginAs, setLoginAs] = useState<"employee" | "student">("employee");
  const [roleError, setRoleError] = useState<string | null>(null);
  const loginAsRef = useRef(loginAs);
  const setSession = useAuthStore((state) => state.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  function switchMode(mode: "employee" | "student") {
    setLoginAs(mode);
    loginAsRef.current = mode;
    setRoleError(null);
  }

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (session) => {
      const storedLoginAs = sessionStorage.getItem("login-as") ?? loginAsRef.current;
      sessionStorage.removeItem("login-as");

      const adminUser = isAdminUser(session.user.roles);

      if (storedLoginAs === "student" && adminUser) {
        setRoleError("Credenciales invalidas");
        return;
      }

      if (storedLoginAs === "employee" && !adminUser) {
        setRoleError("Credenciales invalidas");
        return;
      }

      setSession(session);

      if (session.user.requirePasswordReset) {
        navigate("/change-password", { replace: true });
        return;
      }

      const destination = storedLoginAs === "employee" && adminUser ? "/admin" : "/learn";
      sessionStorage.setItem("login-destination", destination);
      navigate(destination, { replace: true });
    }
  });

  const isStudent = loginAs === "student";

  return (
    <div className={`auth-shell ${isStudent ? "auth-shell-student-mode" : ""}`}>
      {isStudent ? <StudentVisualPanel /> : <EmployeeVisualPanel />}

      <section className={`auth-form-panel ${isStudent ? "auth-form-panel-student" : ""}`}>
        <div className={`auth-card ${isStudent ? "auth-card-student" : ""}`}>

          <div className="login-mode-switcher">
            <button
              className={`login-mode-btn ${!isStudent ? "is-active" : ""}`}
              onClick={() => switchMode("employee")}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20">
                <rect fill="none" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" width="14" x="3" y="8" />
                <path d="M7 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
              </svg>
              Empleado
            </button>
            <button
              className={`login-mode-btn ${isStudent ? "is-active" : ""}`}
              onClick={() => switchMode("student")}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20">
                <path d="M10 3L2 7l8 4 8-4-8-4z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
                <path d="M2 7v5M18 7v5M10 11v6M5.5 9.5v3.5M14.5 9.5v3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
              </svg>
              Estudiante
            </button>
          </div>

          <div className="auth-card-header">
            {isStudent ? (
              <>
                <p className="eyebrow student-eyebrow"></p>
                <div className="student-logo-row">
                  <div className="student-logo-icon">
                    <svg viewBox="0 0 48 48" fill="none">
                      <path d="M24 6L4 16l20 10 20-10-20-10z" fill="url(#sg)" />
                      <path d="M4 16v12M44 16v12M24 26v16" stroke="#2ec5ce" strokeLinecap="round" strokeWidth="2.5" />
                      <path d="M12 20v8M36 20v8" stroke="rgba(46,197,206,0.5)" strokeLinecap="round" strokeWidth="2" />
                      <defs>
                        <linearGradient id="sg" x1="4" y1="6" x2="44" y2="26">
                          <stop stopColor="#2ec5ce" />
                          <stop offset="1" stopColor="#163a63" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div>
                    <div className="student-logo-label">Interactive Lab</div>
                    <strong className="student-logo-title">Campus Virtual</strong>
                  </div>
                </div>
                <p className="student-welcome-text">
                </p>
              </>
            ) : (
              <>
                <p className="eyebrow">Inicio de sesion</p>
                <PlatformLogo />
                <p>Usa tu cuenta operativa para acceder al panel administrativo.</p>
              </>
            )}
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit((values) => {
              setRoleError(null);
              sessionStorage.setItem("login-as", loginAsRef.current);
              loginMutation.mutate(values);
            })}
          >
            {flashMessage && <div className="form-message is-success">{flashMessage}</div>}

            <label className="auth-field">
              <span>{isStudent ? "Correo institucional" : "Correo corporativo"}</span>
              <input
                placeholder={isStudent ? "nombre@institucion.com" : "nombre@empresa.com"}
                {...register("email")}
              />
              {errors.email && <small className="field-error">{errors.email.message}</small>}
            </label>

            <label className="auth-field">
              <span>Contraseña</span>
              <div className="password-field">
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  placeholder="Tu contraseña"
                  {...register("password")}
                />
                <button
                  aria-label={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="password-visibility-button"
                  onClick={() => setIsPasswordVisible(v => !v)}
                  type="button"
                >
                  {isPasswordVisible ? <EyeOffIcon /> : <EyeOpenIcon />}
                </button>
              </div>
              {errors.password && <small className="field-error">{errors.password.message}</small>}
            </label>

            {roleError && (
              <div className="form-message is-error">{roleError}</div>
            )}

            {loginMutation.isError && !roleError && (
              <div className="form-message is-error">
                No pudimos iniciar sesion. Verifica tus credenciales o el estado de tu cuenta.
              </div>
            )}

            <button
              className={`primary-button login-submit-btn ${isStudent ? "login-submit-student" : "users-create-button"}`}
              disabled={loginMutation.isPending}
              type="submit"
            >
              {loginMutation.isPending
                ? "Validando acceso..."
                : isStudent ? "Ingresar al Campus" : "Iniciar sesion"}
            </button>
          </form>

          <div className="auth-card-footer">
            <Link className="text-link" to="/forgot-password">
              Olvide mi contraseña
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
