// src/posts/posts.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OpenAI } from 'openai';
import { Post, PostDocument } from './schemas/post.schema';
import 'dotenv/config';

@Injectable()
export class PostsService {
  private openai: OpenAI;
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generateCaption(text: string): Promise<string> {
    const prompt = `다음 텍스트에 어울리는 SNS 게시물 캡션을 50자 내외로 작성해줘: "${text}"`;
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      return response.choices[0].message?.content?.trim() ?? '캡션을 생성할 수 없습니다.';
    } catch (error) {
      console.error('Error generating caption:', error);
      // 에러 발생 시 500 Internal Server Error 반환
      throw new HttpException('AI 캡션 생성에 실패했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 데이터베이스에 게시물을 저장하는 새로운 메서드 추가
  async create(caption: string, imageUrl: string): Promise<Post> {
    const newPost = new this.postModel({ caption, imageUrl });
    return newPost.save();
  }
}