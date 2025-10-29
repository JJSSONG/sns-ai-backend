// src/auth/auth.controller.ts

import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  UnauthorizedException, 
  Get, 
  Req 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport';
// import { Request } from 'express'; // Request 타입을 사용하기 위해 추가
import type { Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '일반 회원가입 (ID, PW, 닉네임)' })
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.register(createUserDto);
    // 보안을 위해 비밀번호 해시는 응답에서 제외
    const { password, ...result } = user.toObject();
    return { message: '회원가입 성공', user: result };
  }

  @Post('login')
  @ApiOperation({ summary: '일반 로그인 및 JWT 토큰 발급' })
  @ApiBody({ type: LoginUserDto })
  async login(@Body() loginUserDto: LoginUserDto) {
    const user = await this.authService.validateUser(
      loginUserDto.userId,
      loginUserDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    return this.authService.login(user);
  }

  @Get('kakao')
  @ApiOperation({ summary: '카카오 로그인 시작' })
  @UseGuards(AuthGuard('kakao')) // 'kakao' 전략 사용
  async kakaoLogin() {
    // 이 메서드는 카카오 로그인 페이지로 리다이렉트만 담당합니다.
    return;
  }

  @Get('kakao/callback')
  @ApiOperation({ summary: '카카오 로그인 콜백' })
  @UseGuards(AuthGuard('kakao'))
  async kakaoLoginCallback(@Req() req: Request) {
    // KakaoStrategy의 validate에서 반환된 user 정보가 req.user에 담겨 있습니다.
    const user: any = req.user; 
    
    // 카카오 로그인이 성공하면 JWT 토큰을 발급하여 프론트엔드로 전달
    return this.authService.login(user);
  }
}