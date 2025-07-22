import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CommonResponse } from './utils/swagger/CommonResponse';
import { HttpExceptionFilter } from './utils/http-exception.filter';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Social Media API')
    .setDescription('The Social Media API documentation')
    .setVersion('1.0')
    .addGlobalResponse(
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'Internal server error',
        type: CommonResponse,
      },
      {
        status: HttpStatus.BAD_REQUEST,
        description: 'Bad request',
        type: CommonResponse,
      },
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: '*',
    credentials: true,
  });
  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
