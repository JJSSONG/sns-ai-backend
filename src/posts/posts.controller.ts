// src/posts/posts.controller.ts

import { Controller, Post, Get, Body, UseInterceptors, UploadedFiles, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard'; // JWT 가드 임포트
import * as AWS from 'aws-sdk';
import multerS3 from 'multer-s3';
import { Types } from 'mongoose';
import { S3Client } from '@aws-sdk/client-s3';

// S3 설정 (배포 환경 변수를 사용하도록 설정)
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string, // 타입 단언 필요
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string, // 타입 단언 필요
  },
});

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  // 1. 포스팅 생성 API (다중 파일 업로드 및 JWT 인증 필요)
  @Post()
  @UseGuards(JwtAuthGuard) // JWT 인증된 사용자만 접근 가능
  @ApiBearerAuth('access-token') // Swagger에 JWT 토큰 입력 필드 표시
  @ApiOperation({ summary: '새 포스팅 생성 및 AI 콘텐츠 추천' })
  @ApiConsumes('multipart/form-data') // 파일 업로드 API임을 명시
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: '이미지 생성 프롬프트' },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: '업로드할 이미지 파일 (최대 5개)',
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 5, { // 'files' 필드명으로 최대 5개 파일 허용
      storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME as string, // 타입 단언 필요
        key: function (req, file, cb) {
          const ext = file.mimetype.split('/')[1];
          cb(null, `posts/${Date.now()}_${file.originalname}.${ext}`);
        },
      }),
    }),
  )
  async create(
    @UploadedFiles() files: Express.MulterS3.File[],
    @Body() createPostDto: CreatePostDto,
    @Req() req,
  ) {
    if (!files || files.length === 0) {
        throw new Error("이미지 파일을 1개 이상 업로드해야 합니다.");
    }

    // req.user는 JwtStrategy에서 반환된 사용자 정보입니다.
    const userId = new Types.ObjectId(req.user._id);

    const post = await this.postsService.create(userId, files, createPostDto);

    return {
      message: '포스팅 및 AI 콘텐츠 생성이 완료되었습니다.',
      post: {
        imageUrls: post.imageUrls,
        caption: post.caption,
        hashtags: post.hashtags,
        // ... 기타 필드
      }
    };
  }

  // 2. 피드 목록 조회 API
  @Get()
  @UseGuards(JwtAuthGuard) // ✨ JWT 인증된 사용자만 접근 가능
  @ApiBearerAuth('access-token') // Swagger에 JWT 토큰 입력 필드 표시
  @ApiOperation({ summary: '본인이 작성한 피드 목록 조회' }) // ✨ 설명 변경
  async findMyPosts(@Req() req) {
    // JwtStrategy에서 검증 후 req.user에 담긴 사용자 ID (_id) 추출
    const userId = req.user._id; 
    
    // 서비스의 새로운 메서드 호출
    return this.postsService.findMyPosts(userId); 
  }
}