// src/auth/dto/login-user.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ description: '로그인 ID' })
  userId: string;

  @ApiProperty({ description: '비밀번호' })
  password: string;
}