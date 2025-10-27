// src/auth/auth.controller.ts

import { Controller, Post, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto'; // 다음 단계에서 생성 예정

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
      loginUserDto.username,
      loginUserDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    return this.authService.login(user);
  }
}