import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "../components/AuthLayout";
import { PlatformLogo } from "../components/PlatformLogo";
import { loginRequest } from "../lib/auth-api";
import { useAuthStore } from "../state/useAuthStore";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo valido."),
  password: z.string().min(8, "Ingresa tu contrasena.")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const flashMessage =
    typeof location.state?.flashMessage === "string" ? location.state.flashMessage : null;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@interactive-lab.local",
      password: "ChangeMe123!"
    }
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (session) => {
      setSession(session);
      if (session.user.requirePasswordReset) {
        navigate("/change-password", { replace: true });
        return;
      }

      const destination = location.state?.from?.pathname ?? "/";
      navigate(destination, { replace: true });
    }
  });

  return (
    <AuthLayout
      title="Interactive Lab Platform"
     >
      <div className="auth-card">
        <div className="auth-card-header">
          <p className="eyebrow">Inicio de sesion</p>
          <PlatformLogo />
          <p>
            Usa tu cuenta operativa para acceder a dashboard, rutas formativas y escenarios de
            simulacion.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
          {flashMessage && <div className="form-message is-success">{flashMessage}</div>}

          <label className="auth-field">
            <span>Correo corporativo</span>
            <input placeholder="nombre@empresa.com" {...register("email")} />
            {errors.email && <small className="field-error">{errors.email.message}</small>}
          </label>

          <label className="auth-field">
            <span>Contrasena</span>
            <div className="password-field">
              <input
                type={isPasswordVisible ? "text" : "password"}
                placeholder="Tu contrasena"
                {...register("password")}
              />
              <button
                aria-label={isPasswordVisible ? "Ocultar contrasena" : "Mostrar contrasena"}
                className="password-visibility-button"
                onClick={() => setIsPasswordVisible((value) => !value)}
                type="button"
              >
                {isPasswordVisible ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path
                      d="M3 5.5 19 21.5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M10.7 6.2A10.9 10.9 0 0 1 12 6c5.2 0 9.2 4.3 10 6-.5 1-2 3.1-4.3 4.7M14.8 14.9A3.2 3.2 0 0 1 9.1 10"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M6.5 8A15 15 0 0 0 2 12c.8 1.7 4.8 6 10 6 1.4 0 2.6-.2 3.8-.6"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path
                      d="M2 12c.8-1.7 4.8-6 10-6s9.2 4.3 10 6c-.8 1.7-4.8 6-10 6S2.8 13.7 2 12Z"
                      fill="none"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      fill="none"
                      r="3.2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <small className="field-error">{errors.password.message}</small>}
          </label>

          {loginMutation.isError && (
            <div className="form-message is-error">
              No pudimos iniciar sesion. Verifica tus credenciales o el estado de tu cuenta.
            </div>
          )}

          <button className="primary-button" disabled={loginMutation.isPending} type="submit">
            {loginMutation.isPending ? "Validando acceso..." : "Iniciar sesion"}
          </button>
        </form>

        <div className="auth-card-footer">
          <Link className="text-link" to="/forgot-password">
            Olvide mi contrasena
          </Link>
          <p>
            Demo local: <strong>admin@interactive-lab.local</strong> / <strong>ChangeMe123!</strong>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
