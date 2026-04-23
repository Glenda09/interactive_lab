import { apiClient } from "./client";

// ─── Health ───────────────────────────────────────────────────────────────────
export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export interface PlatformUserResponse {
  id: string;
  email: string;
  fullName: string;
  status: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  roles: string[];
  permissions: string[];
  requirePasswordReset: boolean;
  failedLoginCount: number;
  lockedUntil: string | null;
  lastCredentialIssuedAt: string | null;
  lastCredentialEmailSentAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UserCredentialDeliveryResponse {
  status: "sent" | "logged" | "failed" | "skipped";
  mode: string;
  message: string;
}

export interface UserMutationResponse {
  user: PlatformUserResponse;
  message: string;
  credentialDelivery?: UserCredentialDeliveryResponse;
}

// ─── Courses ──────────────────────────────────────────────────────────────────
export interface CourseModuleResponse {
  title: string;
  description: string;
  order: number;
  scenarioId: string | null;
  estimatedMinutes: number;
  type: "simulation" | "theory" | "assessment";
}

export interface CourseResponse {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  status: "draft" | "published" | "archived";
  coverImageUrl: string | null;
  estimatedHours: number;
  objectives: string[];
  tags: string[];
  modules: CourseModuleResponse[];
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// Legacy alias used in DashboardPage
export type CourseSummaryResponse = CourseResponse & { modules: number; estimatedDurationHours: number };

// ─── Scenarios ────────────────────────────────────────────────────────────────
export interface ScenarioResponse {
  id: string;
  code: string;
  title: string;
  description: string;
  version: string;
  status: "draft" | "published" | "archived";
  thumbnailUrl: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  babylonConfig: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type SceneType = "electrical_panel" | "irrigation_drip" | "sprinkler" | "water_cycle" | "comparative" | "default" | "custom";

export interface CustomSceneObject {
  id: string;
  type: "box" | "cylinder" | "sphere" | "ground";
  width?: number;
  height?: number;
  depth?: number;
  diameter?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: [number, number, number];
  metallic?: number;
  roughness?: number;
  emissive?: [number, number, number];
  label?: string;
}

export interface CustomSceneConfig {
  camera?: { alpha: number; beta: number; radius: number };
  backgroundColor?: [number, number, number];
  objects: CustomSceneObject[];
}

export interface ScenarioAnalysisResult {
  sceneType: SceneType;
  confidence: number;
  description: string;
  babylonConfig: CustomSceneConfig & Record<string, unknown>;
}

// ─── Enrollments ──────────────────────────────────────────────────────────────
export interface EnrollmentResponse {
  id: string;
  userId: string;
  courseId: string;
  enrolledBy: string | null;
  status: "active" | "completed" | "dropped" | "suspended";
  completedAt: string | null;
  notes: string;
  createdAt: string | null;
  updatedAt: string | null;
}

// ─── Progress ─────────────────────────────────────────────────────────────────
export interface ModuleProgressResponse {
  moduleIndex: number;
  status: "pending" | "in_progress" | "completed";
  completedAt: string | null;
  attempts: number;
  bestScore: number | null;
  lastSessionId: string | null;
}

export interface ProgressResponse {
  id: string;
  userId: string;
  courseId: string;
  enrollmentId: string;
  modules: ModuleProgressResponse[];
  progressPct: number;
  completedAt: string | null;
  updatedAt: string | null;
}

// ─── Catalog (roles / permissions) ────────────────────────────────────────────
export interface RoleCatalogEntry {
  name: string;
  label: string;
  description: string;
  defaultPermissions: string[];
}

export interface PermissionCatalogEntry {
  name: string;
  label: string;
  category: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// API functions
// ═════════════════════════════════════════════════════════════════════════════

export async function getHealthCheck() {
  const response = await apiClient.get<HealthCheckResponse>("/v1/health");
  return response.data;
}

// Users
export async function getUsers() {
  const response = await apiClient.get<PlatformUserResponse[]>("/v1/users");
  return response.data;
}

export async function createUser(payload: {
  fullName: string;
  email: string;
  roles: string[];
  permissions: string[];
  status: string;
  sendCredentialsEmail: boolean;
}) {
  const response = await apiClient.post<UserMutationResponse>("/v1/users", payload);
  return response.data;
}

export async function updateUser(
  id: string,
  payload: {
    fullName: string;
    email: string;
    roles: string[];
    permissions: string[];
    status: string;
  }
) {
  const response = await apiClient.patch<UserMutationResponse>(`/v1/users/${id}`, payload);
  return response.data;
}

export async function inactivateUser(id: string) {
  const response = await apiClient.patch<UserMutationResponse>(`/v1/users/${id}/inactivate`);
  return response.data;
}

export async function sendUserCredentials(id: string) {
  const response = await apiClient.post<UserMutationResponse>(`/v1/users/${id}/send-credentials`);
  return response.data;
}

// Courses
export async function getCourses(onlyPublished = false) {
  const params = onlyPublished ? "?published=true" : "";
  const response = await apiClient.get<CourseResponse[]>(`/v1/courses${params}`);
  return response.data;
}

export async function getCourse(id: string) {
  const response = await apiClient.get<CourseResponse>(`/v1/courses/${id}`);
  return response.data;
}

export async function createCourse(payload: Partial<CourseResponse>) {
  const response = await apiClient.post<CourseResponse>("/v1/courses", payload);
  return response.data;
}

export async function updateCourse(id: string, payload: Partial<CourseResponse>) {
  const response = await apiClient.patch<CourseResponse>(`/v1/courses/${id}`, payload);
  return response.data;
}

export async function deleteCourse(id: string) {
  const response = await apiClient.delete<{ message: string }>(`/v1/courses/${id}`);
  return response.data;
}

// Scenarios
export async function getScenarios(onlyPublished = false) {
  const params = onlyPublished ? "?published=true" : "";
  const response = await apiClient.get<ScenarioResponse[]>(`/v1/scenarios${params}`);
  return response.data;
}

export async function getScenario(id: string) {
  const response = await apiClient.get<ScenarioResponse>(`/v1/scenarios/${id}`);
  return response.data;
}

export async function createScenario(payload: Partial<ScenarioResponse>) {
  const response = await apiClient.post<ScenarioResponse>("/v1/scenarios", payload);
  return response.data;
}

export async function updateScenario(id: string, payload: Partial<ScenarioResponse>) {
  const response = await apiClient.patch<ScenarioResponse>(`/v1/scenarios/${id}`, payload);
  return response.data;
}

export async function deleteScenario(id: string) {
  const response = await apiClient.delete<{ message: string }>(`/v1/scenarios/${id}`);
  return response.data;
}

// Uploads
export async function uploadImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  const response = await apiClient.post<{ url: string }>("/v1/uploads/image", form, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
}

export async function analyzeScenarioImage(imageUrl: string) {
  const response = await apiClient.post<ScenarioAnalysisResult>("/v1/scenarios/analyze-image", { imageUrl });
  return response.data;
}

// Enrollments
export async function getEnrollments(filters?: { userId?: string; courseId?: string }) {
  const params = new URLSearchParams();
  if (filters?.userId) params.set("userId", filters.userId);
  if (filters?.courseId) params.set("courseId", filters.courseId);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const response = await apiClient.get<EnrollmentResponse[]>(`/v1/enrollments${qs}`);
  return response.data;
}

export async function getMyEnrollments() {
  const response = await apiClient.get<EnrollmentResponse[]>("/v1/enrollments/me");
  return response.data;
}

export async function createEnrollment(payload: { userId: string; courseId: string; notes?: string }) {
  const response = await apiClient.post<EnrollmentResponse>("/v1/enrollments", payload);
  return response.data;
}

export async function selfEnroll(courseId: string) {
  const response = await apiClient.post<EnrollmentResponse>(`/v1/enrollments/self/${courseId}`);
  return response.data;
}

export async function updateEnrollment(id: string, payload: { status?: string; notes?: string }) {
  const response = await apiClient.patch<EnrollmentResponse>(`/v1/enrollments/${id}`, payload);
  return response.data;
}

export async function deleteEnrollment(id: string) {
  const response = await apiClient.delete<{ message: string }>(`/v1/enrollments/${id}`);
  return response.data;
}

// Progress
export async function getMyProgress() {
  const response = await apiClient.get<ProgressResponse[]>("/v1/progress/me");
  return response.data;
}

export async function getMyCourseProgress(courseId: string) {
  const response = await apiClient.get<ProgressResponse>(`/v1/progress/${courseId}`);
  return response.data;
}

// Catalog
export async function getRolesCatalog() {
  const response = await apiClient.get<RoleCatalogEntry[]>("/v1/catalog/roles");
  return response.data;
}

export async function getPermissionsCatalog() {
  const response = await apiClient.get<PermissionCatalogEntry[]>("/v1/catalog/permissions");
  return response.data;
}
