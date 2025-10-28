// src/auth/guard/jwt-auth.guard.ts

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
// 'jwt'는 위에서 정의한 JwtStrategy의 이름입니다.