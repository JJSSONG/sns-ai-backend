// src/users/dto/create-user.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '로그인 ID' })
  username: string;

  @ApiProperty({ description: '비밀번호' })
  password: string;

  @ApiProperty({ description: '사용자 닉네임' })
  nickname: string;
}