// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module'; // UsersService 사용을 위해 임포트
import 'dotenv/config';
import { JwtStrategy } from './strategy/jwt.strategy';
import { KakaoStrategy } from './strategy/kakao.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET, // .env에서 비밀 키 사용
      signOptions: { expiresIn: '60m' }, // 토큰 만료 시간 (예: 60분)
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy, // JWT 전략 등록
    KakaoStrategy, // 카카오 전략 등록
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}