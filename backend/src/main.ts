import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false })
  );
  const configService = app.get(ConfigService);
  const logger = new Logger("Bootstrap");

  await app.register(fastifyHelmet);
  await app.register(fastifyCors, {
    origin: configService.getOrThrow<string[]>("app.corsOrigins"),
    credentials: true
  });
  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: "1 minute"
  });

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Interactive Lab API")
    .setDescription("API inicial para capacitacion virtual con simulacion 3D.")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, swaggerDocument);

  const port = configService.getOrThrow<number>("app.port");
  await app.listen(port, "0.0.0.0");

  logger.log(`Backend escuchando en http://localhost:${port}/api/v1`);
}

bootstrap();

