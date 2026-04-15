import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "../components/AuthLayout";
import { changePasswordRequest } from "../lib/auth-api";
import { useAuthStore } from "../state/useAuthStore";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Ingresa la contrasena temporal o actual."),
    newPassword: z
      .string()
      .min(12, "Usa al menos 12 caracteres.")
      .regex(/[a-z]/, "Agrega una minuscula.")
      .regex(/[A-Z]/, "Agrega una mayuscula.")
      .regex(/\d/, "Agrega un numero.")
      .regex(/[^A-Za-z0-9]/, "Agrega un simbolo."),
    confirmPassword: z.string()
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contrasenas no coinciden."
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const user = useAuthStore((state) => state.user);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema)
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePasswordRequest,
    onSuccess: () => {
      clearSession();
      navigate("/login", {
        replace: true,
        state: {
          flashMessage:
            "Contrasena actualizada correctamente. Inicia sesion otra vez con tu nueva clave."
        }
      });
    }
  });

  return (
    <AuthLayout title="Interactive Lab Platform">
      <div className="auth-card">
        <div className="auth-card-header">
          <p className="eyebrow">Cambio obligatorio</p>
          <h2>Actualiza tu contrasena para activar la cuenta</h2>
          <p>
            {user?.fullName
              ? `${user.fullName}, por seguridad debes reemplazar la contrasena temporal antes de entrar al sistema.`
              : "Por seguridad debes reemplazar la contrasena temporal antes de entrar al sistema."}
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit(({ currentPassword, newPassword }) =>
            changePasswordMutation.mutate({ currentPassword, newPassword })
          )}
        >
          <label className="auth-field">
            <span>Contrasena actual o temporal</span>
            <input type="password" {...register("currentPassword")} />
            {errors.currentPassword && (
              <small className="field-error">{errors.currentPassword.message}</small>
            )}
          </label>

          <label className="auth-field">
            <span>Nueva contrasena</span>
            <input type="password" {...register("newPassword")} />
            {errors.newPassword && (
              <small className="field-error">{errors.newPassword.message}</small>
            )}
          </label>

          <label className="auth-field">
            <span>Confirmar nueva contrasena</span>
            <input type="password" {...register("confirmPassword")} />
            {errors.confirmPassword && (
              <small className="field-error">{errors.confirmPassword.message}</small>
            )}
          </label>

          {changePasswordMutation.isError && (
            <div className="form-message is-error">
              No fue posible actualizar la contrasena. Verifica la clave actual e intenta de nuevo.
            </div>
          )}

          <button className="primary-button" disabled={changePasswordMutation.isPending} type="submit">
            {changePasswordMutation.isPending ? "Aplicando cambios..." : "Guardar nueva contrasena"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
