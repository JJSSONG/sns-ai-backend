// src/auth/strategy/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import 'dotenv/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 헤더에서 Bearer 토큰 추출
      ignoreExpiration: false, // 토큰 만료 시간 검증
      secretOrKey: process.env.JWT_SECRET as string, // .env에서 설정한 비밀 키
    });
    console.log('--- Server JWT_SECRET Used ---');
    console.log(process.env.JWT_SECRET);
  }

  async validate(payload: any) {
    console.log('--- JWT Strategy - Validate Called ---');
    console.log('JWT Payload:', payload);
    // JWT Payload를 받아 DB에서 사용자 유효성 검증
    const user = await this.usersService.findByUsername(payload.username); 

    if (!user) {
      console.log('--- Auth Failed: User not found ---'); // 💥 사용자 조회 실패 로그
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
    
    console.log('--- Auth Success: User ID ---', payload.sub); // ✨ 성공 로그
    // 요청 객체(req.user)에 저장될 사용자 정보를 반환
    const { password, ...result } = user.toObject(); 
    return result;
  }
}