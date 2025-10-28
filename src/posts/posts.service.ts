// src/posts/posts.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OpenAI } from 'openai';
import { Post, PostDocument } from './schemas/post.schema';
import 'dotenv/config';
import { CreatePostDto } from '../posts/dto/create-post.dto';

@Injectable()
export class PostsService {
  private openai: OpenAI;
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  // async generateCaption(text: string): Promise<string> {
  //   const prompt = `다음 텍스트에 어울리는 SNS 게시물 캡션을 50자 내외로 작성해줘: "${text}"`;
  //   try {
  //     const response = await this.openai.chat.completions.create({
  //       model: 'gpt-3.5-turbo',
  //       messages: [{ role: 'user', content: prompt }],
  //       temperature: 0.7,
  //     });
  //     return response.choices[0].message?.content?.trim() ?? '캡션을 생성할 수 없습니다.';
  //   } catch (error) {
  //     console.error('Error generating caption:', error);
  //     // 에러 발생 시 500 Internal Server Error 반환
  //     throw new HttpException('AI 캡션 생성에 실패했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
  //   }
  // }

  // 1. 포스팅 생성 (AI 콘텐츠 포함)
  async create(
    userId: Types.ObjectId,
    files: Express.MulterS3.File[],
    createPostDto: CreatePostDto,
  ): Promise<Post> {
    const imageUrls = files.map(file => file.location);

    // AI에게 해시태그 및 피드 문구 생성 요청
    const aiResponse = await this.generateAiContent(createPostDto.prompt);

    const newPost = new this.postModel({
      userId,
      imageUrls,
      prompt: createPostDto.prompt,
      caption: aiResponse.caption,
      hashtags: aiResponse.hashtags,
    });

    return newPost.save();
  }

  // 2. AI 콘텐츠 생성 함수 (해시태그, 문구)
  private async generateAiContent(prompt: string) {
    const systemMessage = `너는 소셜 미디어 포스팅 전문가야. 사용자의 프롬프트를 바탕으로 다음 JSON 형식에 맞춰 창의적인 피드 문구와 5개의 해시태그를 생성해 줘. 해시태그는 쉼표로 구분해.`;
    const userMessage = `프롬프트: "${prompt}"`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' }, // JSON 형식으로 응답 요청
      });

      const rawJson = completion.choices[0].message.content;
      const parsedContent = JSON.parse(rawJson ?? '{}');
      
      // JSON 예시: { "caption": "...", "hashtags": "해시1,해시2,해시3,해시4,해시5" }
      const hashtagsArray = parsedContent.hashtags.split(',').map(tag => tag.trim());

      return {
        caption: parsedContent.caption,
        hashtags: hashtagsArray,
      };
    } catch (error) {
      console.error('AI 콘텐츠 생성 오류:', error);
      // 오류 발생 시 빈 값 반환
      return { caption: '', hashtags: [] };
    }
  }
  
  // 3. 피드 목록 조회 (작성자 정보 포함)
  async findAll(): Promise<Post[]> {
    return this.postModel
      .find()
      .populate('userId', 'nickname') // 'User' 모델을 참조하여 닉네임 필드만 가져옴
      .sort({ createdAt: -1 }) // 최신순 정렬
      .exec();
  }
}