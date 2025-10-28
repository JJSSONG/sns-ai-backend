// src/posts/schemas/post.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema'; // User 스키마 임포트

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // 작성자 ID

  @Prop({ type: [String], required: true })
  imageUrls: string[]; // 다중 이미지 URL 배열

  @Prop({ required: true })
  prompt: string; // 사용자가 입력한 원본 프롬프트

  @Prop()
  caption: string; // AI 추천 피드 문구

  @Prop({ type: [String] })
  hashtags: string[]; // AI 추천 해시태그 배열
}

export const PostSchema = SchemaFactory.createForClass(Post);