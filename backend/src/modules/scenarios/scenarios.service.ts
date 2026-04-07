import { Injectable } from "@nestjs/common";

@Injectable()
export class ScenariosService {
  private readonly scenarios = [
    {
      id: "scenario_001",
      code: "SCN-PANEL-START",
      title: "Inspeccion inicial de panel",
      version: "1.0.0",
      status: "published",
      engineVersion: "Babylon.js 8"
    }
  ];

  findAll() {
    return this.scenarios;
  }
}

