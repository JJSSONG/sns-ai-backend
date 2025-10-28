// src/auth/strategy/kakao.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';
import 'dotenv/config';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private authService: AuthService, private usersService: UsersService) {
    super({
      clientID: process.env.KAKAO_CLIENT_ID as string,
      clientSecret: process.env.KAKAO_CLIENT_SECRET as string,
      callbackURL: process.env.KAKAO_CALLBACK_URL as string,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const kakaoId = profile.id.toString();
    const nickname = profile.displayName || profile._json.kakao_account.profile.nickname;

    // 1. 카카오 ID로 사용자 찾기
    let user = await this.usersService.findByKakaoId(kakaoId);

    // 2. 사용자가 없다면 새로 생성 (최소 정보만 사용)
    if (!user) {
      user = await this.usersService.create({
        username: `kakao_${kakaoId}`,
        password: Math.random().toString(36).substring(2, 15), // 임시 비밀번호
        nickname: nickname,
        kakaoId: kakaoId,
      });
    }

    done(null, user); // 최종 사용자 정보를 Passport에 전달
  }
}