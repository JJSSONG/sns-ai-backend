// src/auth/auth.service.ts

import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 1. 회원가입
  async register(createUserDto: CreateUserDto): Promise<User> {
    // 이미 존재하는 사용자인지 확인 (username 중복 체크)
    const userExists = await this.usersService.findByUsername(createUserDto.username);
    if (userExists) {
      throw new ConflictException('이미 존재하는 사용자 ID입니다.');
    }
    
    // UsersService의 해시 로직을 통해 사용자 생성
    return this.usersService.create(createUserDto);
  }

  // 2. 로그인 유효성 검증
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    
    if (user) {
      // 비밀번호 해시 비교
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        // 비밀번호가 일치하면 토큰 발급을 위해 비밀번호를 제외한 사용자 정보 반환
        const { password, ...result } = user.toObject();
        return result;
      }
    }
    // 사용자 없거나 비밀번호 불일치 시 null 반환
    return null; 
  }

  // 3. JWT 토큰 발급
  async login(user: any) {
    const payload = { username: user.username, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}