// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('SNS AI Solution API')
    .setDescription('The API documentation for the SNS AI content creation solution')
    .setVersion('1.0')
    .addTag('posts')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        description: 'JWT 토큰 (Bearer [token]) 입력',
      },
      'access-token', // 이 이름으로 토큰을 참조합니다.
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const PORT = process.env.PORT || 3000; // Railway는 process.env.PORT를 제공
  await app.listen(PORT);
}
bootstrap();