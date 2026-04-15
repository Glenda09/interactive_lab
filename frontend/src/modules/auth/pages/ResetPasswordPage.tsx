import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "../components/AuthLayout";
import { resetPasswordRequest } from "../lib/auth-api";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(12, "Debe tener al menos 12 caracteres.")
      .regex(/[a-z]/, "Incluye al menos una minuscula.")
      .regex(/[A-Z]/, "Incluye al menos una mayuscula.")
      .regex(/\d/, "Incluye al menos un numero.")
      .regex(/[^A-Za-z0-9]/, "Incluye al menos un simbolo."),
    confirmPassword: z.string()
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contrasenas no coinciden."
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (values: ResetPasswordFormValues) =>
      resetPasswordRequest({
        token,
        newPassword: values.newPassword
      })
  });

  return (
    <AuthLayout
      eyebrow="Token one-time"
      title="Crea una nueva credencial y revoca sesiones anteriores"
      description="El restablecimiento invalida accesos previos para proteger la operacion y devolver el control de la cuenta al usuario correcto."
    >
      <div className="auth-card">
        <div className="auth-card-header">
          <p className="eyebrow">Reset de contrasena</p>
          <h2>Define una contrasena fuerte</h2>
          <p>
            Usa una clave con mayusculas, minusculas, numeros y simbolos para reforzar la
            seguridad de la sesion.
          </p>
        </div>

        {!token && (
          <div className="form-message is-error">
            No encontramos un token valido en la URL. Solicita un nuevo enlace de recuperacion.
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit((values) => resetPasswordMutation.mutate(values))}
        >
          <label className="auth-field">
            <span>Nueva contrasena</span>
            <input type="password" placeholder="Nueva contrasena" {...register("newPassword")} />
            {errors.newPassword && (
              <small className="field-error">{errors.newPassword.message}</small>
            )}
          </label>

          <label className="auth-field">
            <span>Confirmar contrasena</span>
            <input
              type="password"
              placeholder="Confirma tu nueva contrasena"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <small className="field-error">{errors.confirmPassword.message}</small>
            )}
          </label>

          {resetPasswordMutation.data && (
            <div className="form-message is-success">{resetPasswordMutation.data.message}</div>
          )}

          {resetPasswordMutation.isError && (
            <div className="form-message is-error">
              El enlace no es valido o expiro. Solicita una nueva recuperacion.
            </div>
          )}

          <button
            className="primary-button"
            disabled={resetPasswordMutation.isPending || !token}
            type="submit"
          >
            {resetPasswordMutation.isPending ? "Actualizando acceso..." : "Guardar nueva contrasena"}
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
