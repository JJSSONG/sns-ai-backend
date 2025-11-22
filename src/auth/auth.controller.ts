// src/auth/auth.controller.ts

import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  UnauthorizedException, 
  Get, 
  Req,
  Res
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

  /* @Get('kakao/callback')
  @ApiOperation({ summary: '카카오 로그인 콜백' })
  @UseGuards(AuthGuard('kakao'))
  // @Res()를 사용하고, res: any로 Express 메서드 접근 권한을 확보합니다.
  async kakaoLoginCallback(@Req() req: Request, @Res() res: any) { 
    const user: any = req.user; 
    
    // 1. JWT 토큰 발급
    const tokenPayload = await this.authService.login(user);
    const accessToken = tokenPayload.access_token; 

    // 2. ✨ [핵심 수정] process.env 객체에서 직접 URL 값을 가져옴
    // NOTE: .env 파일이 NestJS 시작 시 로드되어 있어야 합니다. (dotenv/config 또는 ConfigModule 필수)
    // const FRONTEND_SUCCESS_URL = process.env.FRONTEND_SUCCESS_URL;
    
    
    // 3. 토큰을 HttpOnly 쿠키에 설정
    res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000, 
        sameSite: 'Lax',
    });
    
    // 4. 프론트엔드로 리다이렉션
    // URL이 설정되지 않았다면 기본값으로 fallback (방어 코드)
    const redirectUrl = process.env.FRONTEND_SUCCESS_URL || 'https://ssu-web-programming-git-main-ssu-ideation.vercel.app/'; 
    
    return res.redirect(redirectUrl); 
  } */

  @Get('kakao/callback')
  @ApiOperation({ summary: '카카오 로그인 콜백' })
  @UseGuards(AuthGuard('kakao'))
  // ✨ @Res() 데코레이터를 제거하고, 일반적인 HTTP 응답을 반환합니다.
  async kakaoLoginCallback(@Req() req: Request) { 
    const user: any = req.user; 
    
    return this.authService.login(user); // ✨ JSON 응답을 반환하도록 수정
    
  }
}