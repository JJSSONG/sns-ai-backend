// src/users/dto/create-user.dto.ts (수정된 코드)

import { ApiProperty } from '@nestjs/swagger';
// ✨ class-validator에서 IsOptional, IsString 등을 임포트하는 것이 좋습니다.
// import { IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '로그인 ID' })
  userId: string;

  // ✨ 카카오 로그인은 비밀번호가 없으므로 '?'를 붙여 선택적 필드로 변경
  @ApiProperty({ description: '비밀번호', required: false })
  password?: string; // 일반 회원가입 시에만 필요

  @ApiProperty({ description: '사용자 이름/닉네임' })
  username: string;
  
  // ✨ 카카오 로그인 오류 해결을 위해 kakaoId 필드 추가
  @ApiProperty({ description: '카카오 고유 ID', required: false })
  // @IsOptional() // class-validator를 사용한다면 추가
  kakaoId?: string; 
}