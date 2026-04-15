import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuthStore } from "../../auth/state/useAuthStore";
import {
  createUser,
  getUsers,
  inactivateUser,
  PlatformUserResponse,
  sendUserCredentials,
  updateUser
} from "../../../shared/lib/api/platform";

const userFormSchema = z.object({
  fullName: z.string().min(3, "Ingresa el nombre completo."),
  email: z.string().email("Ingresa un correo valido."),
  rolesText: z.string().min(1, "Define al menos un rol."),
  permissionsText: z.string().optional(),
  status: z.string().min(1, "Selecciona el estado."),
  sendCredentialsEmail: z.boolean()
});

type UserFormValues = z.infer<typeof userFormSchema>;
type UserFilter = "all" | "active" | "pending" | "disabled" | "admins";

function parseTagInput(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function formatTagList(values: string[]) {
  return values.join(", ");
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Sin registro";
}

function UserEditIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="m4.5 13.8 7.9-7.9 3.1 3.1-7.9 7.9-3.5.4zM11.5 4.8l1.8-1.8a1.5 1.5 0 0 1 2.1 0l1.6 1.6a1.5 1.5 0 0 1 0 2.1l-1.8 1.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function UserKeyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <circle cx="7" cy="10" fill="none" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10.1 10h5.4M13.5 10v2.1M15.7 10v1.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function UserBlockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <circle cx="10" cy="10" fill="none" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 14 14 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

export function UserManagementPage() {
  const pageSize = 5;
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("edit");
  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState<UserFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const canManageUsers =
    currentUser?.roles.includes("platform_admin") ||
    currentUser?.permissions.some((permission) =>
      ["users.manage", "users.write", "users.create", "users.update", "users.read"].includes(
        permission
      )
    );

  const usersQuery = useQuery({
    queryKey: ["platform-users"],
    queryFn: getUsers,
    enabled: Boolean(canManageUsers)
  });

  const users = useMemo(
    () =>
      [...(usersQuery.data ?? [])].sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;

        if (leftTime === rightTime) {
          return left.fullName.localeCompare(right.fullName);
        }

        return leftTime - rightTime;
      }),
    [usersQuery.data]
  );
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      rolesText: "student",
      permissionsText: "",
      status: "active",
      sendCredentialsEmail: true
    }
  });

  useEffect(() => {
    if (selectedUser) {
      reset({
        fullName: selectedUser.fullName,
        email: selectedUser.email,
        rolesText: formatTagList(selectedUser.roles),
        permissionsText: formatTagList(selectedUser.permissions),
        status: selectedUser.status,
        sendCredentialsEmail: true
      });
      return;
    }

    reset({
      fullName: "",
      email: "",
      rolesText: "student",
      permissionsText: "",
      status: "active",
      sendCredentialsEmail: true
    });
  }, [reset, selectedUser]);

  const filterItems = useMemo(
    () => [
      { key: "all" as const, label: "Todos", count: users.length },
      {
        key: "active" as const,
        label: "Activos",
        count: users.filter((user) => user.status === "active").length
      },
      {
        key: "pending" as const,
        label: "Cambio pendiente",
        count: users.filter((user) => user.requirePasswordReset).length
      },
      {
        key: "disabled" as const,
        label: "Inactivos",
        count: users.filter((user) => user.status === "disabled").length
      },
      {
        key: "admins" as const,
        label: "Administradores",
        count: users.filter((user) => user.roles.includes("platform_admin")).length
      }
    ],
    [users]
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [user.fullName, user.email, ...user.roles].some((value) =>
          value.toLowerCase().includes(normalizedSearch)
        );

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "active" && user.status === "active") ||
        (activeFilter === "pending" && user.requirePasswordReset) ||
        (activeFilter === "disabled" && user.status === "disabled") ||
        (activeFilter === "admins" && user.roles.includes("platform_admin"));

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, searchValue, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(
    () => filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredUsers]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchValue]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const invalidateUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: ["platform-users"] });
  };

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async (response) => {
      await invalidateUsers();
      setEditorMode("edit");
      setSelectedUserId(response.user.id);
      setIsUserModalOpen(false);
      setFeedbackMessage({
        tone: response.credentialDelivery?.status === "failed" ? "error" : "success",
        text: response.credentialDelivery?.message ?? response.message
      });
    },
    onError: () => {
      setFeedbackMessage({
        tone: "error",
        text: "No fue posible crear el usuario. Revisa los datos e intenta de nuevo."
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateUser>[1] }) =>
      updateUser(id, payload),
    onSuccess: async (response) => {
      await invalidateUsers();
      setIsUserModalOpen(false);
      setFeedbackMessage({ tone: "success", text: response.message });
    },
    onError: () => {
      setFeedbackMessage({
        tone: "error",
        text: "No fue posible actualizar el usuario."
      });
    }
  });

  const inactivateUserMutation = useMutation({
    mutationFn: inactivateUser,
    onSuccess: async (response) => {
      await invalidateUsers();
      setFeedbackMessage({ tone: "success", text: response.message });
    },
    onError: () => {
      setFeedbackMessage({
        tone: "error",
        text: "No fue posible inactivar el usuario."
      });
    }
  });

  const resendCredentialsMutation = useMutation({
    mutationFn: sendUserCredentials,
    onSuccess: async (response) => {
      await invalidateUsers();
      setFeedbackMessage({
        tone: response.credentialDelivery?.status === "failed" ? "error" : "success",
        text: response.credentialDelivery?.message ?? response.message
      });
    },
    onError: () => {
      setFeedbackMessage({
        tone: "error",
        text: "No fue posible reenviar credenciales en este momento."
      });
    }
  });

  function handleCreateMode() {
    setEditorMode("create");
    setSelectedUserId(null);
    setIsUserModalOpen(true);
    setFeedbackMessage(null);
  }

  function handleSelectUser(userId: string) {
    setSelectedUserId(userId);
  }

  function handleEditUser(userId: string) {
    setEditorMode("edit");
    setSelectedUserId(userId);
    setIsUserModalOpen(true);
    setFeedbackMessage(null);
  }

  function handleCloseModal() {
    setIsUserModalOpen(false);
    setEditorMode("edit");
  }

  function handleInactivate(user: PlatformUserResponse) {
    if (!window.confirm(`Se inactivara la cuenta de ${user.fullName}. Deseas continuar?`)) {
      return;
    }

    inactivateUserMutation.mutate(user.id);
  }

  if (!canManageUsers) {
    return (
      <section className="page-section admin-dashboard">
        <article className="admin-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Usuarios</p>
              <h3>Acceso restringido</h3>
            </div>
          </div>
          <p>Tu sesion no tiene privilegios para administrar usuarios del sistema.</p>
        </article>
      </section>
    );
  }

  return (
    <section className="page-section admin-dashboard">
      <article className="admin-panel users-showcase-card">
        <div className="users-showcase-header">
          <div className="users-title-block">
            <p className="eyebrow">Administracion de usuarios</p>
            <h2>Usuarios</h2>
            <p>{filteredUsers.length} usuarios encontrados</p>
          </div>

          <div className="users-header-actions">
            <div className="workspace-search user-search">
              <input
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Buscar usuario, correo o rol"
                type="text"
                value={searchValue}
              />
            </div>

            <button className="primary-button users-create-button" onClick={handleCreateMode} type="button">
              Nuevo usuario
            </button>
          </div>
        </div>

        <div className="users-filter-tabs" role="tablist" aria-label="Filtros de usuarios">
          {filterItems.map((item) => (
            <button
              key={item.key}
              className={`users-filter-tab ${activeFilter === item.key ? "is-active" : ""}`}
              onClick={() => setActiveFilter(item.key)}
              type="button"
            >
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </button>
          ))}
        </div>

        {feedbackMessage && (
          <div
            className={`form-message ${
              feedbackMessage.tone === "success" ? "is-success" : "is-error"
            }`}
          >
            {feedbackMessage.text}
          </div>
        )}

        {usersQuery.isLoading && <p>Cargando usuarios...</p>}
        {usersQuery.isError && (
          <div className="form-message is-error">
            No fue posible recuperar el directorio de usuarios.
          </div>
        )}

        {!usersQuery.isLoading && !usersQuery.isError && (
          <div className="user-table-wrapper is-showcase">
            <table className="user-table is-showcase">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Usuario</th>
                  <th>Roles</th>
                  <th>Ultimo acceso</th>
                  <th>Estado</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user, index) => {
                  const initials = user.fullName
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part.charAt(0).toUpperCase())
                    .join("");
                  const rowNumber = (currentPage - 1) * pageSize + index + 1;

                  return (
                    <tr
                      key={user.id}
                      className={selectedUser?.id === user.id ? "is-selected" : ""}
                    >
                      <td className="user-order-cell">{String(rowNumber).padStart(2, "0")}</td>
                      <td>
                        <button
                          className="user-row-anchor is-showcase"
                          onClick={() => handleSelectUser(user.id)}
                          type="button"
                        >
                          <span className="user-avatar-chip">{initials || "IL"}</span>
                          <span className="user-row-copy">
                            <strong>{user.fullName}</strong>
                            <span>{user.email}</span>
                          </span>
                        </button>
                      </td>
                      <td>{user.roles.join(", ") || "Sin roles"}</td>
                      <td>{formatDate(user.lastLoginAt)}</td>
                      <td>
                        <span
                          className={`status-chip ${
                            user.status === "active"
                              ? "is-live"
                              : user.status === "disabled"
                                ? "is-draft"
                                : "is-neutral"
                          }`}
                        >
                          {user.requirePasswordReset ? "Cambio pendiente" : user.status}
                        </span>
                      </td>
                      <td>
                        <div className="user-table-actions is-iconic">
                          <button
                            aria-label={`Editar ${user.fullName}`}
                            className="row-action-button"
                            onClick={() => handleEditUser(user.id)}
                            type="button"
                            title="Editar"
                          >
                            <UserEditIcon />
                          </button>
                          <button
                            aria-label={`Reenviar credenciales a ${user.fullName}`}
                            className="row-action-button"
                            disabled={resendCredentialsMutation.isPending}
                            onClick={() => resendCredentialsMutation.mutate(user.id)}
                            type="button"
                            title="Reenviar credenciales"
                          >
                            <UserKeyIcon />
                          </button>
                          <button
                            aria-label={`Inactivar ${user.fullName}`}
                            className="row-action-button is-danger"
                            disabled={inactivateUserMutation.isPending || currentUser?.id === user.id}
                            onClick={() => handleInactivate(user)}
                            type="button"
                            title="Inactivar"
                          >
                            <UserBlockIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="table-empty-state">
                No encontramos usuarios con ese criterio de busqueda.
              </div>
            )}
          </div>
        )}

        {filteredUsers.length > pageSize && (
          <div className="table-pagination">
            <p>
              Mostrando {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, filteredUsers.length)} de {filteredUsers.length}
            </p>
            <div className="table-pagination-actions">
              <button
                className="secondary-button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                type="button"
              >
                Anterior
              </button>
              <span>
                Pagina {currentPage} de {totalPages}
              </span>
              <button
                className="secondary-button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                type="button"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </article>

      {isUserModalOpen && (
        <div className="user-modal-backdrop" onClick={handleCloseModal} role="presentation">
          <article
            aria-modal="true"
            className="user-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="user-modal-header">
              <div>
                <p className="eyebrow">{editorMode === "edit" ? "Edicion" : "Alta segura"}</p>
                <h3>{editorMode === "edit" ? "Editar usuario" : "Crear nuevo usuario"}</h3>
              </div>

              <button className="user-modal-close" onClick={handleCloseModal} type="button">
                Cerrar
              </button>
            </div>

            <form
              className="auth-form user-admin-form"
              onSubmit={handleSubmit((values) => {
                const payload = {
                  fullName: values.fullName.trim(),
                  email: values.email.trim(),
                  roles: parseTagInput(values.rolesText),
                  permissions: parseTagInput(values.permissionsText ?? ""),
                  status: values.status
                };

                if (editorMode === "edit" && selectedUser) {
                  updateUserMutation.mutate({ id: selectedUser.id, payload });
                  return;
                }

                createUserMutation.mutate({
                  ...payload,
                  sendCredentialsEmail: values.sendCredentialsEmail
                });
              })}
            >
              <div className="user-form-grid">
                <label className="auth-field">
                  <span>Nombre completo</span>
                  <input {...register("fullName")} />
                  {errors.fullName && <small className="field-error">{errors.fullName.message}</small>}
                </label>

                <label className="auth-field">
                  <span>Correo</span>
                  <input {...register("email")} />
                  {errors.email && <small className="field-error">{errors.email.message}</small>}
                </label>

                <label className="auth-field">
                  <span>Roles</span>
                  <input
                    {...register("rolesText")}
                    placeholder="platform_admin, instructor, student"
                  />
                  {errors.rolesText && <small className="field-error">{errors.rolesText.message}</small>}
                </label>

                <label className="auth-field">
                  <span>Estado</span>
                  <select {...register("status")}>
                    <option value="active">Activo</option>
                    <option value="suspended">Suspendido</option>
                    <option value="blocked">Bloqueado</option>
                    <option value="disabled">Inactivo</option>
                  </select>
                </label>
              </div>

              <label className="auth-field">
                <span>Permisos</span>
                <input
                  {...register("permissionsText")}
                  placeholder="users.read, courses.read, assessments.grade"
                />
              </label>

              {editorMode === "create" && (
                <label className="user-checkbox">
                  <input type="checkbox" {...register("sendCredentialsEmail")} />
                  <span>Enviar correo con credenciales temporales al crear la cuenta</span>
                </label>
              )}

              <div className="user-form-actions">
                <button
                  className="primary-button"
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  type="submit"
                >
                  {editorMode === "edit"
                    ? updateUserMutation.isPending
                      ? "Guardando..."
                      : "Guardar cambios"
                    : createUserMutation.isPending
                      ? "Creando..."
                      : "Crear usuario"}
                </button>

                {editorMode === "edit" && selectedUser && (
                  <>
                    <button
                      className="secondary-button"
                      disabled={resendCredentialsMutation.isPending}
                      onClick={() => resendCredentialsMutation.mutate(selectedUser.id)}
                      type="button"
                    >
                      {resendCredentialsMutation.isPending ? "Enviando..." : "Reenviar credenciales"}
                    </button>

                    <button
                      className="secondary-button is-danger"
                      disabled={
                        inactivateUserMutation.isPending || currentUser?.id === selectedUser.id
                      }
                      onClick={() => handleInactivate(selectedUser)}
                      type="button"
                    >
                      Inactivar usuario
                    </button>
                  </>
                )}
              </div>
            </form>

            {editorMode === "edit" && selectedUser && (
              <div className="user-detail-grid">
                <div className="admin-status-block">
                  <div className="admin-status-line">
                    <span>Ultimo acceso</span>
                    <strong>{formatDate(selectedUser.lastLoginAt)}</strong>
                  </div>
                  <div className="admin-status-line">
                    <span>Ultimo envio credenciales</span>
                    <strong>{formatDate(selectedUser.lastCredentialEmailSentAt)}</strong>
                  </div>
                  <div className="admin-status-line">
                    <span>Cambio pendiente</span>
                    <strong>{selectedUser.requirePasswordReset ? "Si" : "No"}</strong>
                  </div>
                </div>
              </div>
            )}
          </article>
        </div>
      )}
    </section>
  );
}
