import { Injectable } from "@nestjs/common";

@Injectable()
export class CoursesService {
  private readonly courses = [
    {
      id: "course_001",
      code: "ELEC-BAS-001",
      title: "Operacion segura de panel electrico",
      status: "published",
      modules: 4,
      estimatedDurationHours: 10
    },
    {
      id: "course_002",
      code: "IND-MTN-002",
      title: "Mantenimiento preventivo industrial",
      status: "draft",
      modules: 6,
      estimatedDurationHours: 16
    }
  ];

  findAll() {
    return this.courses;
  }
}

