// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✨ CORS 설정 추가 및 로컬 포트 허용
  app.enableCors({
    // React 개발 서버 주소 명시
    origin: ['http://localhost:3000', 'https://ssu-web-programming-1yel08o1j-ssu-ideation.vercel.app', 'https://ssu-web-programming-git-main-ssu-ideation.vercel.app'], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // 허용할 HTTP 메서드
    credentials: true, // 인증 정보(쿠키, Authorization 헤더) 허용
  });

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