-- =========================================================
-- Interactive Lab - Esquema base de capacitacion (PostgreSQL)
-- Version: borrador de revision v1
-- Enfoque:
--   * capacitacion virtual como nucleo transaccional
--   * seguridad fuerte y control de acceso
--   * proteccion de datos y trazabilidad
--   * modelo normalizado con espacio para escalar
--
-- Supuestos alineados con la documentacion del proyecto:
--   * PostgreSQL es el sistema de registro principal
--   * el almacenamiento de objetos conserva binarios y multimedia fuera de la base
--   * la telemetria de simulacion puede separarse a otro almacenamiento despues
--   * la plataforma inicia como tenant unico logico, pero el esquema
--     queda preparado para crecer a multiples organizaciones
-- =========================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS training;

SET search_path TO training, public;

CREATE OR REPLACE FUNCTION training.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =========================================================
-- 1. Organizacion e identidad
-- =========================================================

CREATE TABLE training.organizaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code citext NOT NULL,
  name varchar(150) NOT NULL,
  legal_name varchar(200),
  status varchar(20) NOT NULL DEFAULT 'activo',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz,
  CONSTRAINT chk_organizations_status
    CHECK (status IN ('activo', 'inactivo', 'suspendido')),
  CONSTRAINT uq_organizations_code UNIQUE (code)
);

CREATE TABLE training.usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_ref varchar(100),
  email citext NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pendiente',
  email_verified_at timestamptz,
  last_login_at timestamptz,
  failed_login_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz,
  CONSTRAINT chk_users_status
    CHECK (status IN ('pendiente', 'activo', 'bloqueado', 'suspendido', 'deshabilitado'))
);

CREATE UNIQUE INDEX uq_users_email_active
  ON training.usuarios (email)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_users_external_ref_active
  ON training.usuarios (external_ref)
  WHERE external_ref IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE training.perfiles_usuario (
  id_usuario uuid PRIMARY KEY
    REFERENCES training.usuarios(id) ON DELETE CASCADE,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  display_name varchar(150),
  phone_number varchar(30),
  locale varchar(20) NOT NULL DEFAULT 'es-SV',
  timezone varchar(60) NOT NULL DEFAULT 'America/El_Salvador',
  job_title varchar(120),
  department varchar(120),
  profile_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE training.preferencias_usuario (
  id_usuario uuid PRIMARY KEY
    REFERENCES training.usuarios(id) ON DELETE CASCADE,
  language_code varchar(12) NOT NULL DEFAULT 'es',
  timezone varchar(60) NOT NULL DEFAULT 'America/El_Salvador',
  email_notifications_enabled boolean NOT NULL DEFAULT true,
  in_app_notifications_enabled boolean NOT NULL DEFAULT true,
  accessibility_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE training.membresias_organizacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_organizacion uuid NOT NULL
    REFERENCES training.organizaciones(id) ON DELETE RESTRICT,
  id_usuario uuid NOT NULL
    REFERENCES training.usuarios(id) ON DELETE RESTRICT,
  membership_status varchar(20) NOT NULL DEFAULT 'activo',
  joined_at timestamptz NOT NULL DEFAULT NOW(),
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_organization_memberships_status
    CHECK (membership_status IN ('invitado', 'activo', 'suspendido', 'inactivo')),
  CONSTRAINT uq_organization_memberships UNIQUE (id_organizacion, id_usuario)
);

CREATE TABLE training.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code citext NOT NULL,
  name varchar(120) NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_roles_code UNIQUE (code)
);

CREATE TABLE training.permisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code citext NOT NULL,
  name varchar(150) NOT NULL,
  description text,
  resource varchar(100) NOT NULL,
  action varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_permissions_code UNIQUE (code)
);

CREATE TABLE training.roles_permisos (
  id_rol uuid NOT NULL
    REFERENCES training.roles(id) ON DELETE CASCADE,
  id_permiso uuid NOT NULL
    REFERENCES training.permisos(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_rol, id_permiso)
);

CREATE TABLE training.asignaciones_rol_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL
    REFERENCES training.usuarios(id) ON DELETE RESTRICT,
  id_rol uuid NOT NULL
    REFERENCES training.roles(id) ON DELETE RESTRICT,
  id_organizacion uuid
    REFERENCES training.organizaciones(id) ON DELETE RESTRICT,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  id_usuario_asignador uuid
    REFERENCES training.usuarios(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT NOW(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revocation_reason text
);

CREATE UNIQUE INDEX uq_user_role_assignments_active_scoped
  ON training.asignaciones_rol_usuario (id_usuario, id_rol, id_organizacion)
  WHERE revoked_at IS NULL AND id_organizacion IS NOT NULL;

CREATE UNIQUE INDEX uq_user_role_assignments_active_global
  ON training.asignaciones_rol_usuario (id_usuario, id_rol)
  WHERE revoked_at IS NULL AND id_organizacion IS NULL;

CREATE TABLE training.credenciales_usuario (
  id_usuario uuid PRIMARY KEY
    REFERENCES training.usuarios(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  password_algorithm varchar(30) NOT NULL DEFAULT 'argon2id',
  password_changed_at timestamptz NOT NULL DEFAULT NOW(),
  require_password_reset boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE training.sesiones_autenticacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL
    REFERENCES training.usuarios(id) ON DELETE RESTRICT,
  id_organizacion uuid
    REFERENCES training.organizaciones(id) ON DELETE SET NULL,
  device_label varchar(150),
  device_fingerprint_hash varchar(255),
  user_agent text,
  ip_address inet,
  started_at timestamptz NOT NULL DEFAULT NOW(),
  last_seen_at timestamptz NOT NULL DEFAULT NOW(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_sessions_user_active
  ON training.sesiones_autenticacion (id_usuario, expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE training.tokens_refresco (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_sesion uuid NOT NULL
    REFERENCES training.sesiones_autenticacion(id) ON DELETE CASCADE,
  id_usuario uuid NOT NULL
    REFERENCES training.usuarios(id) ON DELETE RESTRICT,
  token_hash varchar(255) NOT NULL,
  id_token_refresco_origen uuid
    REFERENCES training.tokens_refresco(id) ON DELETE SET NULL,
  issued_at timestamptz NOT NULL DEFAULT NOW(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_refresh_tokens_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_session_active
  ON training.tokens_refresco (id_sesion, expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE training.tokens_restablecimiento_contrasena (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL
    REFERENCES training.usuarios(id) ON DELETE CASCADE,
  token_hash varchar(255) NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT NOW(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  request_ip inet,
  requester_user_agent text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_password_reset_tokens_hash UNIQUE (token_hash)
);

-- =========================================================
-- 2. Catalogo academico
-- =========================================================

CREATE TABLE training.categorias_curso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_organizacion uuid NOT NULL
    REFERENCES training.organizaciones(id) ON DELETE RESTRICT,
  id_categoria_padre uuid
    REFERENCES training.categorias_curso(id) ON DELETE SET NULL,
  code citext NOT NULL,
  name varchar(150) NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_course_categories_code UNIQUE (id_organizacion, code)
);

CREATE TABLE training.cursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_organizacion uuid NOT NULL
    REFERENCES training.organizaciones(id) ON DELETE RESTRICT,
  id_categoria uuid
    REFERENCES training.categorias_curso(id) ON DELETE SET NULL,
  code citext NOT NULL,
  slug varchar(160) NOT NULL,
  title varchar(200) NOT NULL,
  description text,
  status varchar(20) NOT NULL DEFAULT 'borrador',
  difficulty varchar(20) NOT NULL DEFAULT 'principiante',
  estimated_minutes integer NOT NULL DEFAULT 0,
  version_no integer NOT NULL DEFAULT 1,
  is_certification boolean NOT NULL DEFAULT false,
  visibility varchar(20) NOT NULL DEFAULT 'privado',
  id_usuario_creador uuid
    REFERENCES training.usuarios(id) ON DELETE SET NULL,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz,
  CONSTRAINT chk_courses_status
    CHECK (status IN ('borrador', 'publicado', 'archivado')),
  CONSTRAINT chk_courses_difficulty
    CHECK (difficulty IN ('principiante', 'intermedio', 'avanzado', 'experto')),
  CONSTRAINT chk_courses_visibility
    CHECK (visibility IN ('privado', 'organizacion', 'publico')),
  CONSTRAINT uq_courses_slug UNIQUE (id_organizacion, slug)
);

CREATE UNIQUE INDEX uq_courses_code_active
  ON training.cursos (id_organizacion, code)
  WHERE deleted_at IS NULL;

CREATE TABLE training.prerequisitos_curso (
  id_curso uuid NOT NULL
    REFERENCES training.cursos(id) ON DELETE CASCADE,
  id_curso_prerrequisito uuid NOT NULL
    REFERENCES training.cursos(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_curso, id_curso_prerrequisito),
  CONSTRAINT chk_course_prerequisites_distinct
    CHECK (id_curso <> id_curso_prerrequisito)
);

CREATE TABLE training.cohortes_curso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_organizacion uuid NOT NULL
    REFERENCES training.organizaciones(id) ON DELETE RESTRICT,
  id_curso uuid NOT NULL
    REFERENCES training.cursos(id) ON DELETE RESTRICT,
  code varchar(80) NOT NULL,
  name varchar(150) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'borrador',
  start_at timestamptz,
  due_at timestamptz,
  capacity integer,
  id_usuario_creador uuid
    REFERENCES training.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_course_batches_status
    CHECK (status IN ('borrador', 'abierto', 'cerrado', 'archivado')),
  CONSTRAINT chk_course_batches_capacity
    CHECK (capacity IS NULL OR capacity > 0),
  CONSTRAINT uq_course_batches_code UNIQUE (id_curso, code)
);

CREATE TABLE training.modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_curso uuid NOT NULL
    REFERENCES training.cursos(id) ON DELETE CASCADE,
  code varchar(80),
  title varchar(200) NOT NULL,
  description text,
  sort_order integer NOT NULL,
  module_type varchar(20) NOT NULL DEFAULT 'teoria',
  estimated_minutes integer NOT NULL DEFAULT 0,
  is_mandatory boolean NOT NULL DEFAULT true,
  pass_weight numeric(5,2) NOT NULL DEFAULT 0.00,
  version_no integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz,
  CONSTRAINT chk_modules_type
    CHECK (module_type IN ('teoria', 'practica', 'mixto')),
  CONSTRAINT chk_modules_pass_weight
    CHECK (pass_weight >= 0 AND pass_weight <= 100),
  CONSTRAINT uq_modules_sort UNIQUE (id_curso, sort_order)
);

CREATE UNIQUE INDEX uq_modules_code_active
  ON training.modulos (id_curso, code)
  WHERE code IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE training.prerequisitos_modulo (
  id_modulo uuid NOT NULL
    REFERENCES training.modulos(id) ON DELETE CASCADE,
  id_modulo_prerrequisito uuid NOT NULL
    REFERENCES training.modulos(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_modulo, id_modulo_prerrequisito),
  CONSTRAINT chk_module_prerequisites_distinct
    CHECK (id_modulo <> id_modulo_prerrequisito)
);

CREATE TABLE training.archivos_recurso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_organizacion uuid NOT NULL
    REFERENCES training.organizaciones(id) ON DELETE RESTRICT,
  storage_provider varchar(50) NOT NULL,
  bucket_name varchar(120) NOT NULL,
  object_key text NOT NULL,
  original_file_name varchar(255) NOT NULL,
  mime_type varchar(120) NOT NULL,
  byte_size bigint NOT NULL,
  checksum_sha256 char(64),
  visibility varchar(20) NOT NULL DEFAULT 'privado',
  id_usuario_cargador uuid
    REFERENCES training.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_file_assets_visibility
    CHECK (visibility IN ('privado', 'interno', 'publico')),
  CONSTRAINT chk_file_assets_byte_size
    CHECK (byte_size >= 0),
  CONSTRAINT uq_file_assets_storage UNIQUE (storage_provider, bucket_name, object_key)
);

CREATE TABLE training.recursos_aprendizaje (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_modulo uuid NOT NULL
    REFERENCES training.modulos(id) ON DELETE CASCADE,
  id_archivo_recurso uuid
    REFERENCES training.archivos_recurso(id) ON DELETE SET NULL,
  resource_type varchar(20) NOT NULL,
  title varchar(200) NOT NULL,
  description text,
  external_url text,
  html_content text,
  sort_order integer NOT NULL,
  estimated_minutes integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  is_preview boolean NOT NULL DEFAULT false,
  version_no integer NOT NULL DEFAULT 1,
  visibility varchar(20) NOT NULL DEFAULT 'privado',
  id_usuario_creador uuid
    REFERENCES training.usuarios(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz,
  CONSTRAINT chk_learning_resources_type
    CHECK (resource_type IN ('video', 'pdf', 'html', 'enlace', 'scorm', 'paquete_3d')),
  CONSTRAINT chk_learning_resources_visibility
    CHECK (visibility IN ('privado', 'organizacion', 'publico')),
  CONSTRAINT chk_learning_resources_source
    CHECK (
      (CASE WHEN id_archivo_recurso IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN external_url IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN html_content IS NOT NULL THEN 1 ELSE 0 END) = 1
    ),
  CONSTRAINT uq_learning_resources_sort UNIQUE (id_modulo, sort_order)
);

CREATE TABLE training.evaluaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_modulo uuid NOT NULL
    REFERENCES training.modulos(id) ON DELETE CASCADE,
  assessment_type varchar(20) NOT NULL DEFAULT 'teorica',
  title varchar(200) NOT NULL,
  description text,
  max_score numeric(8,2) NOT NULL,
  pass_score numeric(8,2) NOT NULL,
  attempt_limit integer NOT NULL DEFAULT 1,
  grading_mode varchar(20) NOT NULL DEFAULT 'automatica',
  time_limit_minutes integer,
  is_required boolean NOT NULL DEFAULT true,
  weight numeric(5,2) NOT NULL DEFAULT 0.00,
  sort_order integer NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'borrador',
  available_from timestamptz,
  available_until timestamptz,
  id_usuario_creador uuid
    REFERENCES training.usuarios(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz,
  CONSTRAINT chk_assessments_type
    CHECK (assessment_type IN ('teorica', 'practica', 'mixta')),
  CONSTRAINT chk_assessments_grading_mode
    CHECK (grading_mode IN ('automatica', 'manual', 'mixta')),
  CONSTRAINT chk_assessments_status
    CHECK (status IN ('borrador', 'publicado', 'archivado')),
  CONSTRAINT chk_assessments_score_range
    CHECK (max_score > 0 AND pass_score >= 0 AND pass_score <= max_score),
  CONSTRAINT chk_assessments_attempt_limit
    CHECK (attempt_limit > 0),
  CONSTRAINT chk_assessments_weight
    CHECK (weight >= 0 AND weight <= 100),
  CONSTRAINT uq_assessments_sort UNIQUE (id_modulo, sort_order)
);

CREATE TABLE training.preguntas_evaluacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_evaluacion uuid NOT NULL
    REFERENCES training.evaluaciones(id) ON DELETE CASCADE,
  question_type varchar(30) NOT NULL,
  prompt_text text NOT NULL,
  explanation_text text,
  sort_order integer NOT NULL,
  max_score numeric(8,2) NOT NULL DEFAULT 0.00,
  is_required boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_assessment_questions_type
    CHECK (question_type IN ('opcion_unica', 'opcion_multiple', 'verdadero_falso', 'respuesta_corta', 'ensayo')),
  CONSTRAINT chk_assessment_questions_score
    CHECK (max_score >= 0),
  CONSTRAINT uq_assessment_questions_sort UNIQUE (id_evaluacion, sort_order)
);

CREATE TABLE training.opciones_pregunta_evaluacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pregunta uuid NOT NULL
    REFERENCES training.preguntas_evaluacion(id) ON DELETE CASCADE,
  option_key varchar(20),
  option_text text NOT NULL,
  sort_order integer NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_assessment_question_options_sort UNIQUE (id_pregunta, sort_order)
);

CREATE TABLE training.criterios_evaluacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_evaluacion uuid NOT NULL
    REFERENCES training.evaluaciones(id) ON DELETE CASCADE,
  id_pregunta uuid
    REFERENCES training.preguntas_evaluacion(id) ON DELETE CASCADE,
  criterion_name varchar(150) NOT NULL,
  description text,
  max_score numeric(8,2) NOT NULL,
  sort_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_assessment_criteria_score
    CHECK (max_score >= 0),
  CONSTRAINT uq_assessment_criteria_sort UNIQUE (id_evaluacion, sort_order)
);

-- =========================================================
-- 3. Inscripciones, progreso y certificados
-- =========================================================

CREATE TABLE training.inscripciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_organizacion uuid NOT NULL
    REFERENCES training.organizaciones(id) ON DELETE RESTRICT,
  id_cohorte uuid
    REFERENCES training.cohortes_curso(id) ON DELETE SET NULL,
  id_usuario uuid NOT NULL
    REFERENCES training.usuarios(id) ON DELETE RESTRICT,
  id_curso uuid NOT NULL
    REFERENCES training.cursos(id) ON DELETE RESTRICT,
  id_usuario_asignador uuid
    REFERENCES training.usuarios(id) ON DELETE SET NULL,
  enrollment_type varchar(20) NOT NULL DEFAULT 'manual',
  status varchar(20) NOT NULL DEFAULT 'activo',
  start_at timestamptz NOT NULL DEFAULT NOW(),
  due_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  last_activity_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz,
  CONSTRAINT chk_enrollments_type
    CHECK (enrollment_type IN ('manual', 'masiva', 'auto')),
  CONSTRAINT chk_enrollments_status
    CHECK (status IN ('activo', 'completado', 'cancelado', 'vencido'))
);

CREATE UNIQUE INDEX uq_enrollments_one_active
  ON training.inscripciones (id_usuario, id_curso)
  WHERE status = 'activo' AND deleted_at IS NULL;

CREATE INDEX idx_enrollments_course_status
  ON training.inscripciones (id_curso, status);

CREATE TABLE training.progreso_recurso_aprendizaje (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_inscripcion uuid NOT NULL
    REFERENCES training.inscripciones(id) ON DELETE CASCADE,
  id_usuario uuid NOT NULL
    REFERENCES training.usuarios(id) ON DELETE RESTRICT,
  id_recurso uuid NOT NULL
    REFERENCES training.recursos_aprendizaje(id) ON DELETE CASCADE,
  progress_percent numeric(5,2) NOT NULL DEFAULT 0.00,
  status varchar(20) NOT NULL DEFAULT 'no_iniciado',
  started_at timestamptz,
  last_accessed_at timestamptz,
  completed_at timestamptz,
  time_spent_seconds bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_learning_resource_progress_percent
    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  CONSTRAINT chk_learning_resource_progress_status
    CHECK (status IN ('no_iniciado', 'en_progreso', 'completado', 'omitido')),
  CONSTRAINT chk_learning_resource_progress_time
    CHECK (time_spent_seconds >= 0),
  CONSTRAINT uq_learning_resource_progress UNIQUE (id_inscripcion, id_recurso)
);

CREATE INDEX idx_learning_resource_progress_user_status
  ON training.progreso_recurso_aprendizaje (id_usuario, status);

CREATE TABLE training.progreso_modulo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_inscripcion uuid NOT NULL
    REFERENCES training.inscripciones(id) ON DELETE CASCADE,
  id_usuario uuid NOT NULL
    REFERENCES training.usuarios(id) ON DELETE RESTRICT,
  id_modulo uuid NOT NULL
    REFERENCES training.modulos(id) ON DELETE CASCADE,
  progress_percent numeric(5,2) NOT NULL DEFAULT 0.00,
  status varchar(20) NOT NULL DEFAULT 'no_iniciado',
  completed_resources integer NOT NULL DEFAULT 0,
  passed_assessments integer NOT NULL DEFAULT 0,
  time_spent_seconds bigint NOT NULL DEFAULT 0,
  last_activity_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_module_progress_percent
    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  CONSTRAINT chk_module_progress_status
    CHECK (status IN ('no_iniciado', 'en_progreso', 'completado', 'aprobado', 'reprobado', 'vencido')),
  CONSTRAINT chk_module_progress_counts
    CHECK (completed_resources >= 0 AND passed_assessments >= 0 AND time_spent_seconds >= 0),
  CONSTRAINT uq_module_progress UNIQUE (id_inscripcion, id_modulo)
);

CREATE TABLE training.progreso_curso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_inscripcion uuid NOT NULL UNIQUE
    REFERENCES training.inscripciones(id) ON DELETE CASCADE,
  id_usuario uuid NOT NULL
    REFERENCES training.usuarios(id) ON DELETE RESTRICT,
  id_curso uuid NOT NULL
    REFERENCES training.cursos(id) ON DELETE RESTRICT,
  progress_percent numeric(5,2) NOT NULL DEFAULT 0.00,
  status varchar(20) NOT NULL DEFAULT 'no_iniciado',
  completed_modules integer NOT NULL DEFAULT 0,
  passed_assessments integer NOT NULL DEFAULT 0,
  time_spent_seconds bigint NOT NULL DEFAULT 0,
  last_activity_at timestamptz,
  completed_at timestamptz,
  certificate_issued_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_course_progress_percent
    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  CONSTRAINT chk_course_progress_status
    CHECK (status IN ('no_iniciado', 'en_progreso', 'completado', 'aprobado', 'reprobado', 'vencido')),
  CONSTRAINT chk_course_progress_counts
    CHECK (completed_modules >= 0 AND passed_assessments >= 0 AND time_spent_seconds >= 0)
);

CREATE TABLE training.certificados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_inscripcion uuid NOT NULL UNIQUE
    REFERENCES training.inscripciones(id) ON DELETE RESTRICT,
  id_usuario uuid NOT NULL
    REFERENCES training.usuarios(id) ON DELETE RESTRICT,
  id_curso uuid NOT NULL
    REFERENCES training.cursos(id) ON DELETE RESTRICT,
  certificate_number varchar(80) NOT NULL,
  id_archivo_recurso uuid
    REFERENCES training.archivos_recurso(id) ON DELETE SET NULL,
  id_usuario_emisor uuid
    REFERENCES training.usuarios(id) ON DELETE SET NULL,
  issued_at timestamptz NOT NULL DEFAULT NOW(),
  expires_at timestamptz,
  status varchar(20) NOT NULL DEFAULT 'activo',
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_certificates_status
    CHECK (status IN ('activo', 'revocado', 'vencido')),
  CONSTRAINT uq_certificates_number UNIQUE (certificate_number)
);

-- =========================================================
-- 4. Intentos de evaluacion y calificacion
-- =========================================================

CREATE TABLE training.intentos_evaluacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_inscripcion uuid NOT NULL
    REFERENCES training.inscripciones(id) ON DELETE CASCADE,
  id_usuario uuid NOT NULL
    REFERENCES training.usuarios(id) ON DELETE RESTRICT,
  id_evaluacion uuid NOT NULL
    REFERENCES training.evaluaciones(id) ON DELETE RESTRICT,
  attempt_number integer NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'en_progreso',
  started_at timestamptz NOT NULL DEFAULT NOW(),
  submitted_at timestamptz,
  graded_at timestamptz,
  id_usuario_calificador uuid
    REFERENCES training.usuarios(id) ON DELETE SET NULL,
  score numeric(8,2),
  passed boolean,
  time_spent_seconds bigint NOT NULL DEFAULT 0,
  feedback text,
  id_archivo_evidencia uuid
    REFERENCES training.archivos_recurso(id) ON DELETE SET NULL,
  manual_override_reason text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_assessment_attempts_number
    CHECK (attempt_number > 0),
  CONSTRAINT chk_assessment_attempts_status
    CHECK (status IN ('en_progreso', 'enviado', 'calificado', 'aprobado', 'reprobado', 'cancelado', 'vencido')),
  CONSTRAINT chk_assessment_attempts_time
    CHECK (time_spent_seconds >= 0),
  CONSTRAINT uq_assessment_attempts_number UNIQUE (id_usuario, id_evaluacion, attempt_number)
);

CREATE INDEX idx_assessment_attempts_user_assessment
  ON training.intentos_evaluacion (id_usuario, id_evaluacion, started_at DESC);

CREATE TABLE training.respuestas_intento_evaluacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_intento uuid NOT NULL
    REFERENCES training.intentos_evaluacion(id) ON DELETE CASCADE,
  id_pregunta uuid NOT NULL
    REFERENCES training.preguntas_evaluacion(id) ON DELETE RESTRICT,
  answer_text text,
  answer_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_correct boolean,
  awarded_score numeric(8,2),
  graded_at timestamptz,
  id_usuario_calificador uuid
    REFERENCES training.usuarios(id) ON DELETE SET NULL,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_assessment_attempt_answers UNIQUE (id_intento, id_pregunta)
);

CREATE TABLE training.opciones_respuesta_intento_evaluacion (
  id_respuesta uuid NOT NULL
    REFERENCES training.respuestas_intento_evaluacion(id) ON DELETE CASCADE,
  id_opcion uuid NOT NULL
    REFERENCES training.opciones_pregunta_evaluacion(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_respuesta, id_opcion)
);

-- =========================================================
-- 5. Notificaciones y auditoria
-- =========================================================

CREATE TABLE training.notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_organizacion uuid
    REFERENCES training.organizaciones(id) ON DELETE SET NULL,
  id_usuario uuid NOT NULL
    REFERENCES training.usuarios(id) ON DELETE CASCADE,
  notification_type varchar(80) NOT NULL,
  title varchar(180) NOT NULL,
  message text NOT NULL,
  channel varchar(20) NOT NULL DEFAULT 'en_aplicacion',
  status varchar(20) NOT NULL DEFAULT 'pendiente',
  related_resource_type varchar(80),
  id_recurso_relacionado uuid,
  scheduled_at timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_notifications_channel
    CHECK (channel IN ('en_aplicacion', 'correo')),
  CONSTRAINT chk_notifications_status
    CHECK (status IN ('pendiente', 'enviado', 'entregado', 'leido', 'fallido'))
);

CREATE INDEX idx_notifications_user_status
  ON training.notificaciones (id_usuario, status, created_at DESC);

CREATE TABLE training.registros_auditoria (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_organizacion uuid
    REFERENCES training.organizaciones(id) ON DELETE SET NULL,
  id_usuario_actor uuid
    REFERENCES training.usuarios(id) ON DELETE SET NULL,
  event_category varchar(30) NOT NULL,
  action varchar(120) NOT NULL,
  resource_type varchar(120) NOT NULL,
  id_recurso text,
  before_snapshot jsonb,
  after_snapshot jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  occurred_at timestamptz NOT NULL DEFAULT NOW(),
  id_correlacion uuid,
  success boolean NOT NULL DEFAULT true,
  CONSTRAINT chk_audit_logs_category
    CHECK (event_category IN ('seguridad', 'academico', 'administrativo', 'notificacion'))
);

CREATE INDEX idx_audit_logs_occurred_at
  ON training.registros_auditoria (occurred_at DESC);

CREATE INDEX idx_audit_logs_actor
  ON training.registros_auditoria (id_usuario_actor, occurred_at DESC);

CREATE INDEX idx_audit_logs_resource
  ON training.registros_auditoria (resource_type, id_recurso, occurred_at DESC);

-- =========================================================
-- 6. Triggers de actualizacion
-- =========================================================

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON training.organizaciones
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON training.usuarios
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON training.perfiles_usuario
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON training.preferencias_usuario
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_organization_memberships_updated_at
  BEFORE UPDATE ON training.membresias_organizacion
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON training.roles
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_permissions_updated_at
  BEFORE UPDATE ON training.permisos
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_user_credentials_updated_at
  BEFORE UPDATE ON training.credenciales_usuario
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_auth_sessions_updated_at
  BEFORE UPDATE ON training.sesiones_autenticacion
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_course_categories_updated_at
  BEFORE UPDATE ON training.categorias_curso
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON training.cursos
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_course_batches_updated_at
  BEFORE UPDATE ON training.cohortes_curso
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_modules_updated_at
  BEFORE UPDATE ON training.modulos
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_learning_resources_updated_at
  BEFORE UPDATE ON training.recursos_aprendizaje
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_assessments_updated_at
  BEFORE UPDATE ON training.evaluaciones
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_assessment_questions_updated_at
  BEFORE UPDATE ON training.preguntas_evaluacion
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_assessment_question_options_updated_at
  BEFORE UPDATE ON training.opciones_pregunta_evaluacion
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_assessment_criteria_updated_at
  BEFORE UPDATE ON training.criterios_evaluacion
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_enrollments_updated_at
  BEFORE UPDATE ON training.inscripciones
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_learning_resource_progress_updated_at
  BEFORE UPDATE ON training.progreso_recurso_aprendizaje
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_module_progress_updated_at
  BEFORE UPDATE ON training.progreso_modulo
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_course_progress_updated_at
  BEFORE UPDATE ON training.progreso_curso
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_certificates_updated_at
  BEFORE UPDATE ON training.certificados
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_assessment_attempts_updated_at
  BEFORE UPDATE ON training.intentos_evaluacion
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_assessment_attempt_answers_updated_at
  BEFORE UPDATE ON training.respuestas_intento_evaluacion
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON training.notificaciones
  FOR EACH ROW EXECUTE FUNCTION training.set_updated_at();

-- =========================================================
-- 7. Datos semilla de RBAC
-- =========================================================

INSERT INTO training.roles (code, name, description, is_system)
VALUES
  ('student', 'Estudiante', 'Consume cursos, realiza evaluaciones y revisa su progreso.', true),
  ('instructor', 'Instructor', 'Acompana, evalua y retroalimenta estudiantes.', true),
  ('supervisor', 'Supervisor', 'Consulta avance y cumplimiento de su equipo.', true),
  ('academic_admin', 'Administrador academico', 'Gestiona oferta academica, asignaciones y criterios.', true),
  ('platform_admin', 'Administrador de plataforma', 'Gestiona usuarios, seguridad y parametros globales.', true),
  ('content_manager', 'Gestor de contenido', 'Administra contenidos y recursos de aprendizaje.', true),
  ('auditor', 'Auditor', 'Revisa bitacoras, trazabilidad y evidencia.', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO training.permisos (code, name, description, resource, action)
VALUES
  ('usuarios.read', 'Consultar usuarios', 'Consultar usuarios.', 'usuarios', 'read'),
  ('usuarios.create', 'Crear usuarios', 'Crear usuarios.', 'usuarios', 'create'),
  ('usuarios.update', 'Actualizar usuarios', 'Actualizar usuarios.', 'usuarios', 'update'),
  ('usuarios.disable', 'Deshabilitar usuarios', 'Bloquear o deshabilitar usuarios.', 'usuarios', 'disable'),
  ('roles.read', 'Consultar roles', 'Consultar roles.', 'roles', 'read'),
  ('roles.assign', 'Asignar roles', 'Asignar roles.', 'roles', 'assign'),
  ('permisos.manage', 'Administrar permisos', 'Administrar permisos.', 'permisos', 'manage'),
  ('cursos.read', 'Consultar cursos', 'Consultar cursos.', 'cursos', 'read'),
  ('cursos.create', 'Crear cursos', 'Crear cursos.', 'cursos', 'create'),
  ('cursos.update', 'Actualizar cursos', 'Actualizar cursos.', 'cursos', 'update'),
  ('cursos.publish', 'Publicar cursos', 'Publicar cursos.', 'cursos', 'publish'),
  ('modulos.manage', 'Administrar modulos', 'Administrar modulos.', 'modulos', 'manage'),
  ('resources.manage', 'Administrar recursos', 'Administrar recursos.', 'resources', 'manage'),
  ('evaluaciones.create', 'Crear evaluaciones', 'Crear evaluaciones.', 'evaluaciones', 'create'),
  ('evaluaciones.grade', 'Calificar evaluaciones', 'Calificar evaluaciones.', 'evaluaciones', 'grade'),
  ('results.override', 'Sobrescribir resultados', 'Sobrescribir resultados manualmente.', 'results', 'override'),
  ('progress.read.self', 'Consultar progreso propio', 'Consultar progreso propio.', 'progress', 'read_self'),
  ('progress.read.team', 'Consultar progreso del equipo', 'Consultar progreso del equipo.', 'progress', 'read_team'),
  ('progress.read.all', 'Consultar progreso global', 'Consultar progreso global.', 'progress', 'read_all'),
  ('audit.read', 'Consultar auditoria', 'Consultar auditoria.', 'audit', 'read'),
  ('audit.export', 'Exportar auditoria', 'Exportar auditoria.', 'audit', 'export'),
  ('notificaciones.send', 'Enviar notificaciones', 'Enviar notificaciones.', 'notificaciones', 'send'),
  ('notificaciones.manage', 'Administrar notificaciones', 'Administrar notificaciones.', 'notificaciones', 'manage'),
  ('settings.manage', 'Administrar configuraciones', 'Administrar configuraciones globales.', 'settings', 'manage')
ON CONFLICT (code) DO NOTHING;

COMMIT;


