// src/app.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadsModule } from './uploads/uploads.module';
import 'dotenv/config';
import { PostsModule } from './posts/posts.module';

const dbUri = process.env.DATABASE_URL;

if (!dbUri) {
  throw new Error('DATABASE_URL is not defined in the environment variables.');
}

@Module({
  imports: [
    MongooseModule.forRoot(dbUri),
    UploadsModule, // Add '!' here
    PostsModule, // PostsModule을 임포트합니다.
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}