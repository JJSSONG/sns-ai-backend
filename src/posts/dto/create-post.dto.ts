// src/posts/dto/create-post.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ description: '사용자가 입력한 이미지 생성 프롬프트' })
  prompt: string;

  @ApiProperty({ description: '사용자가 업로드한 이미지 URL 배열' })
  imageUrls: string[];

  @ApiProperty({ description: 'AI가 생성한 피드 문구' })
  caption: string;

  @ApiProperty({ description: 'AI가 추천한 해시태그 배열' })
  hashtags: string[];
}