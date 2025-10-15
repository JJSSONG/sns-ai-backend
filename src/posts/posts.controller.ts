// src/posts/posts.controller.ts

import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
// import { Express } from 'express';
import { diskStorage } from 'multer';
import { PostsService } from './posts.service';
import { UploadsService } from '../uploads/uploads.service';
import { Post as PostSchema } from './schemas/post.schema';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: '이미지 업로드 및 AI 캡션 생성' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'AI 캡션 생성에 사용할 텍스트' },
        file: {
          type: 'string',
          format: 'binary',
          description: '업로드할 이미지 파일',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
      }),
    }),
  )
  async createPost(
    @Body('text') text: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB 제한
          new FileTypeValidator({ fileType: 'image/(jpeg|png|gif)' }), // jpeg, png, gif만 허용
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    // 1. 이미지 파일 S3에 업로드
    const imageUrl = await this.uploadsService.uploadFile(file);

    // 2. AI 캡션 생성
    const caption = await this.postsService.generateCaption(text);

    // 3. 데이터베이스에 게시물 저장
    const newPost = await this.postsService.create(caption, imageUrl);

    return {
      message: '게시물 생성 및 저장이 완료되었습니다.',
      post: newPost,
    };
  }
}