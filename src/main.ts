import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks(); // Cloud Run sends SIGTERM on scale-down

  const config = new DocumentBuilder()
    .setTitle('My Community API')
    .setDescription('Resident, Security, Admin and Integration modules')
    .setVersion('0.2.0')
    .addApiKey({ type: 'apiKey', name: 'x-role', in: 'header' }, 'x-role')
    .addApiKey({ type: 'apiKey', name: 'x-user-id', in: 'header' }, 'x-user-id')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  // Cloud Run injects PORT (8080) and requires binding to 0.0.0.0
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`API running on http://localhost:${port}  |  Swagger: http://localhost:${port}/docs`);
}
bootstrap();
