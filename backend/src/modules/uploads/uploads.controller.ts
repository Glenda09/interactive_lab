import {
  BadRequestException,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { FastifyRequest } from "fastify";
import { createWriteStream } from "fs";
import { join, extname } from "path";
import { pipeline } from "stream/promises";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard.js";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

@ApiTags("uploads")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("uploads")
export class UploadsController {
  @Post("image")
  @HttpCode(200)
  @ApiConsumes("multipart/form-data")
  @ApiOkResponse({ description: "URL de la imagen subida." })
  async uploadImage(@Req() req: FastifyRequest) {
    const file = await req.file();
    if (!file) throw new BadRequestException("No se recibió ningún archivo.");
    if (!ALLOWED_MIME.has(file.mimetype))
      throw new BadRequestException("Tipo de archivo no permitido. Usa JPEG, PNG, WEBP o GIF.");

    const ext = extname(file.filename) || `.${file.mimetype.split("/")[1]}`;
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const dest = join(process.cwd(), "uploads", filename);

    await pipeline(file.file, createWriteStream(dest));

    return { url: `/uploads/${filename}` };
  }
}
