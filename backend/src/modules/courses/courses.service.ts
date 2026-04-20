import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AuthenticatedUser } from "../../shared/auth/jwt.strategy.js";
import { CreateCourseDto } from "./dto/create-course.dto.js";
import { UpdateCourseDto } from "./dto/update-course.dto.js";
import { Course, CourseDocument } from "./schemas/course.schema.js";

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>
  ) {}

  async findAll(onlyPublished = false) {
    const filter = onlyPublished ? { status: "published" } : {};
    const courses = await this.courseModel.find(filter).sort({ createdAt: -1 }).exec();
    return courses.map((c) => this.serialize(c));
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Curso no encontrado.");
    const course = await this.courseModel.findById(id).exec();
    if (!course) throw new NotFoundException("Curso no encontrado.");
    return this.serialize(course);
  }

  async create(dto: CreateCourseDto, actor: AuthenticatedUser) {
    this.assertCanManage(actor);
    const existing = await this.courseModel.findOne({ code: dto.code.toUpperCase() }).exec();
    if (existing) throw new ConflictException("Ya existe un curso con ese código.");

    const course = await this.courseModel.create({
      ...dto,
      code: dto.code.toUpperCase(),
      createdBy: actor.sub
    });
    return this.serialize(course);
  }

  async update(id: string, dto: UpdateCourseDto, actor: AuthenticatedUser) {
    this.assertCanManage(actor);
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Curso no encontrado.");

    if (dto.code) {
      const existing = await this.courseModel
        .findOne({ code: dto.code.toUpperCase(), _id: { $ne: id } })
        .exec();
      if (existing) throw new ConflictException("Ya existe un curso con ese código.");
      dto.code = dto.code.toUpperCase();
    }

    const updated = await this.courseModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!updated) throw new NotFoundException("Curso no encontrado.");
    return this.serialize(updated);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    this.assertCanManage(actor);
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Curso no encontrado.");
    const deleted = await this.courseModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException("Curso no encontrado.");
    return { message: "Curso eliminado." };
  }

  private assertCanManage(actor: AuthenticatedUser) {
    const isAdmin = actor.roles.includes("platform_admin") || actor.roles.includes("instructor");
    const hasPerm = actor.permissions.some((p) =>
      ["courses.manage", "courses.create", "courses.write"].includes(p)
    );
    if (!isAdmin && !hasPerm) throw new ForbiddenException("Sin permisos para gestionar cursos.");
  }

  private serialize(course: CourseDocument) {
    return {
      id: course.id as string,
      code: course.code,
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      status: course.status,
      coverImageUrl: course.coverImageUrl,
      estimatedHours: course.estimatedHours,
      objectives: course.objectives,
      tags: course.tags,
      modules: course.modules,
      createdBy: course.createdBy,
      createdAt: (course as unknown as { createdAt: Date }).createdAt ?? null,
      updatedAt: (course as unknown as { updatedAt: Date }).updatedAt ?? null
    };
  }
}
