import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AuthenticatedUser } from "../../shared/auth/jwt.strategy.js";
import { CreateEnrollmentDto, UpdateEnrollmentDto } from "./dto/create-enrollment.dto.js";
import { Enrollment, EnrollmentDocument } from "./schemas/enrollment.schema.js";

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>
  ) {}

  async findAll() {
    const items = await this.enrollmentModel.find().sort({ createdAt: -1 }).exec();
    return items.map((e) => this.serialize(e));
  }

  async findByUser(userId: string) {
    const items = await this.enrollmentModel.find({ userId }).sort({ createdAt: -1 }).exec();
    return items.map((e) => this.serialize(e));
  }

  async findByCourse(courseId: string) {
    const items = await this.enrollmentModel.find({ courseId }).sort({ createdAt: -1 }).exec();
    return items.map((e) => this.serialize(e));
  }

  async enroll(dto: CreateEnrollmentDto, actor: AuthenticatedUser) {
    this.assertCanManage(actor);

    const existing = await this.enrollmentModel
      .findOne({ userId: dto.userId, courseId: dto.courseId })
      .exec();
    if (existing) throw new ConflictException("El usuario ya está inscrito en este curso.");

    const enrollment = await this.enrollmentModel.create({
      ...dto,
      enrolledBy: actor.sub,
      status: "active"
    });
    return this.serialize(enrollment);
  }

  async selfEnroll(courseId: string, actor: AuthenticatedUser) {
    const existing = await this.enrollmentModel
      .findOne({ userId: actor.sub, courseId })
      .exec();
    if (existing) throw new ConflictException("Ya estás inscrito en este curso.");

    const enrollment = await this.enrollmentModel.create({
      userId: actor.sub,
      courseId,
      enrolledBy: actor.sub,
      status: "active"
    });
    return this.serialize(enrollment);
  }

  async update(id: string, dto: UpdateEnrollmentDto, actor: AuthenticatedUser) {
    this.assertCanManage(actor);
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Inscripción no encontrada.");

    const updateData: Partial<{ status: string; notes: string; completedAt: Date | null }> = {
      ...dto
    };
    if (dto.status === "completed") updateData.completedAt = new Date();

    const updated = await this.enrollmentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!updated) throw new NotFoundException("Inscripción no encontrada.");
    return this.serialize(updated);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    this.assertCanManage(actor);
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Inscripción no encontrada.");
    const deleted = await this.enrollmentModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException("Inscripción no encontrada.");
    return { message: "Inscripción eliminada." };
  }

  async getMyEnrollments(actor: AuthenticatedUser) {
    return this.findByUser(actor.sub);
  }

  private assertCanManage(actor: AuthenticatedUser) {
    const isAdmin = actor.roles.includes("platform_admin") || actor.roles.includes("instructor");
    const hasPerm = actor.permissions.some((p) =>
      ["enrollments.manage", "enrollments.write"].includes(p)
    );
    if (!isAdmin && !hasPerm)
      throw new ForbiddenException("Sin permisos para gestionar inscripciones.");
  }

  private serialize(e: EnrollmentDocument) {
    return {
      id: e.id as string,
      userId: e.userId,
      courseId: e.courseId,
      enrolledBy: e.enrolledBy,
      status: e.status,
      completedAt: e.completedAt,
      notes: e.notes,
      createdAt: (e as unknown as { createdAt: Date }).createdAt ?? null,
      updatedAt: (e as unknown as { updatedAt: Date }).updatedAt ?? null
    };
  }
}
