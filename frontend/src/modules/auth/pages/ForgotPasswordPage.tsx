import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "../components/AuthLayout";
import { forgotPasswordRequest } from "../lib/auth-api";

const forgotPasswordSchema = z.object({
  email: z.string().email("Ingresa un correo valido.")
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPasswordRequest
  });

  return (
    <AuthLayout
      title="Restablece el acceso a tu cuenta"
      >
      <div className="auth-card">
        <div className="auth-card-header">
          <p className="eyebrow">Olvide mi contrasena</p>
          <h2>Solicita un enlace de recuperacion</h2>
          <p>
            Te enviaremos instrucciones para recuperar el acceso si existe una cuenta asociada al
            correo.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit((values) => forgotPasswordMutation.mutate(values))}
        >
          <label className="auth-field">
            <span>Correo corporativo</span>
            <input placeholder="nombre@empresa.com" {...register("email")} />
            {errors.email && <small className="field-error">{errors.email.message}</small>}
          </label>

          {forgotPasswordMutation.data && (
            <div className="form-message is-success">{forgotPasswordMutation.data.message}</div>
          )}

          {forgotPasswordMutation.isError && (
            <div className="form-message is-error">
              No pudimos procesar la solicitud en este momento. Intenta de nuevo en unos minutos.
            </div>
          )}

          <button className="primary-button" disabled={forgotPasswordMutation.isPending} type="submit">
            {forgotPasswordMutation.isPending ? "Generando solicitud..." : "Enviar instrucciones"}
          </button>
        </form>

        <div className="auth-card-footer">
          <Link className="text-link" to="/login">
            Volver al login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
