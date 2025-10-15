// src/app.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadsModule } from './uploads/uploads.module';
import 'dotenv/config';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DATABASE_URL!),
    UploadsModule, // Add '!' here
    PostsModule, // PostsModule을 임포트합니다.
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}