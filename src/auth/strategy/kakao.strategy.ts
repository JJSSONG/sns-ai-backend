// src/auth/strategy/kakao.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';
import 'dotenv/config';
import { Types } from 'mongoose'; // ✨ mongoose에서 Types 임포트

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
    const username = profile.displayName || profile._json.kakao_account.profile.nickname;
    // 카카오 계정 이메일 추출 (정보 제공 동의 시)
    const kakaoEmail = profile._json.kakao_account?.email;

    // 1. 카카오 ID로 사용자 찾기 (기존 소셜 로그인 사용자)
    let user = await this.usersService.findByKakaoId(kakaoId);
    
    // 2. 카카오 ID로 없으면, 이메일을 DB의 userId와 비교하여 일반 회원 찾기 (계정 연동 시도)
    if (!user && kakaoEmail) {
        // ✨ [핵심 수정] 카카오 이메일을 DB의 userId(로그인 ID)와 비교
        user = await this.usersService.findByUserId(kakaoEmail); 
    }

    if (user) {
        // ✨ [연동 로직] 기존 사용자인데 kakaoId가 없는 경우 연동
        if (!user.kakaoId) {
            // UsersService에 updateKakaoId 메서드가 있어야 함 (ObjectId 기반 업데이트)
            await this.usersService.updateKakaoId(user._id as Types.ObjectId, kakaoId);
            user.kakaoId = kakaoId;
        }
        return done(null, user); // 로그인 처리
    }

    // 3. 완전히 새로운 사용자 (신규 가입)
    user = await this.usersService.create({
        userId: `kakao_${kakaoId}`, // 소셜 전용 ID 포맷
        password: Math.random().toString(36).substring(2, 15), // 임시 비밀번호
        username: username,
        kakaoId: kakaoId,
    });
    
    return done(null, user); // 최종 사용자 정보를 Passport에 전달
  }
}