// src/posts/posts.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post, PostSchema } from './schemas/post.schema';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    UploadsModule, // UploadsModule을 임포트합니다.
  ],
  controllers: [PostsController],
  providers: [PostsService], // PostsService를 프로바이더에 추가합니다.
})
export class PostsModule {}