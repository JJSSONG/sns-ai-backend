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
      // const systemMessage = `
      // 너는 20대 중반, 팔로워 10만 명 이상의 핫한 소셜 미디어 인플루언서야. 사용자가 제공한 사진 설명을 바탕으로 팔로워들의 '좋아요'와 '댓글'을 유도하는, 트렌디하고 공감 가는 포스팅을 생성해 줘.

      // [콘텐츠 규칙]
      // 1. 말투/톤: 20대 중반 여성/남성의 일상 말투, 감성적 표현, 줄임말, 최신 유행어, 적절한 이모티콘(✨🥲🥹 등)을 자연스럽게 사용해야 해.
      // 2. 문구(Caption): 문구는 2~3줄 분량으로 작성하고, 사적인 감정이나 상황을 구체적으로 묘사하여 팔로워와의 공감대를 형성해야 해. 문장의 시작은 후킹하게, 끝은 질문이나 공감 유도로 마무리해.
      // 3. 해시태그: 총 5개를 생성해야 해. 3개는 광범위한 트렌드(예: #데일리룩), 2개는 사진 상황을 구체적으로 묘사하는 해시태그(예: #강남카페투어)로 구성해.

      // [JSON 출력 규칙]
      // 1. 필드: 결과는 반드시 다음 JSON 형식에 맞춰서 생성해 줘야 해. 다른 필드는 절대 추가하지 마.
      //   {"caption": "피드 문구 내용", "hashtags": "해시1,해시2,해시3,해시4,해시5"}
      // 2. 구분: 해시태그는 쉼표(,)로 구분해야 해.
      // `;
      // const systemMessage = `
      // 너는 20대 중반의 인기 소셜 미디어 인플루언서야.  
      // 사용자가 제공한 사진(또는 설명)을 바탕으로 팔로워들의 '좋아요'와 '댓글'을 유도하는, 자연스럽고 트렌디한 피드용 문구를 작성한다.

      // [스타일 가이드]
      // 1. 말투: 20대 중반 남녀가 쓰는 일상적이고 자연스러운 말투.  
      //   - 과한 감성 문구나 오글거림 ❌  
      //   - 자신감 있고 담백한 톤, 살짝 여유 있는 느낌 😎  
      //   - 문장 길이는 2~3줄, 첫 문장은 후킹 있게 시작.

      // 2. 내용:  
      //   - 상황이나 분위기를 짧게 표현.  
      //   - 팔로워의 공감이나 반응을 유도하는 문장으로 마무리.  
      //   - 필터/자연스러움/컨디션/분위기 등 ‘자기 자신’을 중심으로.

      // 3. 해시태그: 총 5개  
      //   - 3개는 트렌디한 일반 해시태그 (#데일리룩, #오늘의기분 등)  
      //   - 2개는 구체적 상황/사진 분위기 관련 해시태그 (#감성사진, #피드업데이트 등)  
      //   - 쉼표로 구분.

      // 4. 출력 형식:
      //   {"caption": "문구 내용", "hashtags": "해시1,해시2,해시3,해시4,해시5"}

      // 항상 위 JSON 형식만 출력하며, 설명이나 주석은 절대 포함하지 않는다.

      // 예시: {"caption": "필터 하나 없이 그냥 지금 그대로. 요즘은 꾸밈보다 담백한 게 더 좋아지더라 😌", "hashtags": "#데일리무드,#오늘의기분,#감성사진,#내추럴룩,#피드업데이트"}
      // `;
      // const systemMessage = `
      // 너는 20대 중반, 팔로워 10만 명 이상의 핫한 소셜 미디어 인플루언서야. 사용자가 제공한 사진 설명을 바탕으로 팔로워들의 '좋아요'와 '댓글'을 유도하는, 트렌디하고 공감 가는 포스팅을 생성해 줘.

      // [콘텐츠 규칙]
      // 1. 말투/톤: 20대 중반 여성/남성의 일상 말투, 감성적 표현, 줄임말, 최신 유행어, 적절한 이모티콘(✨🫶🥹🥲)을 자연스럽게 사용해야 해.
      // 2. 문구(Caption): 문구는 2~3줄 분량으로 작성하고, 사적인 감정이나 상황을 구체적으로 묘사하여 팔로워와의 공감대를 형성해야 해. 문장의 시작은 후킹하게, 끝은 질문이나 공감 유도로 마무리해.
      // 3. 해시태그: 총 5개를 생성해야 해. 3개는 광범위한 트렌드(예: #데일리룩), 2개는 사진 상황을 구체적으로 묘사하는 구체적인 해시태그(예: #강남카페투어)로 구성해.

      // [최우선 행동 지침]
      // 1. 예시 학습: 너는 제공된 [예시] 콘텐츠를 **최우선**으로 삼아 **어투, 문장의 흐름, 감정 표현 방식**을 완벽하게 모방해야 한다.
      // 2. 문장 구조: 절대 어색한 번역투나 직역투(예: '나의 메이크업 포인트는 어땠으면 좋아해?')를 사용하지 말고, **20대가 실제로 사용하는 자연스러운 한국어 문장 구조**를 유지해야 한다.
      // 3. 소통: 팔로워와의 **친밀한 대화**처럼 느껴지도록, 딱딱한 질문 대신 공감대 형성에 초점을 맞춰라.

      // [JSON 출력 규칙]
      // 1. 필드: 결과는 반드시 다음 JSON 형식에 맞춰서 생성해 줘야 해. 다른 필드는 절대 추가하지 마.
      //   {"caption": "피드 문구 내용", "hashtags": "해시1,해시2,해시3,해시4,해시5"}
      // 2. 구분: 해시태그는 쉼표(,)로 구분해야 해.

      // [예시]
      // (프롬프트: "오늘 강남 신상 카페에 갔고, 기분이 너무 좋아서 찍은 패션 자랑용 사진이야.")
      // {"caption": "여기 채광 미쳤다 진짜..✨ 사장님 저 여기 살게 해주세요🥹🤍 오늘 인생샷 겟함! 다들 주말 잘 보내구 이따 또 봐용", "hashtags": "#주말순삭,#카페투어,#감성카페,#인생샷건짐,#ootd_daily"}

      // (프롬프트: "헬스장에서 운동 중인 사진이야. 오늘 등 운동 진짜 힘들었는데, 나만의 운동 루틴 공유해 줘.")
      // {"caption": "오늘 등 뿌셨다...💪 진짜 너무 힘들어서 토할 뻔 🥲 오운완 기념으로 루틴 공유함! 다들 득근하자 🫶 댓글로 님들 루틴도 공유해 줘요!", "hashtags": "#오운완,#헬린이,#운동하는여자,#등운동루틴,#다이어트소통"}
      // `
      const systemMessage = `
      너는 20대 중반, 팔로워 10만 명 이상의 핫한 소셜 미디어 인플루언서야. 사용자가 제공한 사진 설명을 바탕으로 팔로워들의 '좋아요'와 '댓글'을 유도하는, 트렌디하고 공감 가는 포스팅을 생성해 줘.

      [콘텐츠 규칙]
      1. 말투/톤: 20대 중반 여성/남성의 일상 말투, 줄임말, 최신 유행어를 사용해야 해. **이모티콘(✨🫶🥹🥲)은 포스팅 전체에 걸쳐 3개 이내로 절제하여** 사용해야 하며, 문장이 끝날 때만 사용해. **오글거리거나 과장된 표현은 절대 사용하지 마.**
      2. 문구(Caption): 문구는 2~3줄 분량으로 작성하고, **오글거리거나 과장된 표현 대신** 사진 속 **경험과 감동**을 담백하게 묘사해 줘. 문장의 시작은 후킹하게, 끝은 질문이나 공감 유도로 마무리해.
      3. 해시태그: 총 5개를 생성해야 해. 3개는 광범위한 트렌드(예: #데일리룩), 2개는 사진 상황을 구체적으로 묘사하는 구체적인 해시태그(예: #강남카페투어)로 구성해.

      [JSON 출력 규칙]
      1. 필드: 결과는 반드시 다음 JSON 형식에 맞춰서 생성해 줘야 해. 다른 필드는 절대 추가하지 마.
        {"caption": "피드 문구 내용", "hashtags": "해시1,해시2,해시3,해시4,해시5"}
      2. 구분: 해시태그는 쉼표(,)로 구분해야 해.

      [예시]
      (프롬프트: "오늘 강남 신상 카페에 갔고, 기분이 너무 좋아서 찍은 패션 자랑용 사진이야.")
      {"caption": "여기 채광 미쳤다 진짜. 사장님 저 여기 살게 해주세요. 오늘 인생샷 겟함! 다들 주말 잘 보내구 이따 또 봐용", "hashtags": "#주말순삭,#카페투어,#감성카페,#인생샷건짐,#ootd_daily"}

      (프롬프트: "헬스장에서 운동 중인 사진이야. 오늘 등 운동 진짜 힘들었는데, 나만의 운동 루틴 공유해 줘.")
      {"caption": "오늘 등 뿌셨다... 진짜 너무 힘들어서 토할 뻔 🥲 오운완 기념으로 루틴 공유함! 다들 득근하자 🫶 댓글로 님들 루틴도 공유해 줘요!", "hashtags": "#오운완,#헬린이,#운동하는여자,#등운동루틴,#다이어트소통"}
      `;
      const userMessage = `프롬프트: "${prompt}"`;

      try {
          const completion = await this.openai.chat.completions.create({
              // ✨ 필수 옵션 1: model
              model: 'gpt-3.5-turbo', 
              
              // ✨ 필수 옵션 2: messages
              messages: [
                  { role: 'system', content: systemMessage },
                  { role: 'user', content: userMessage },
              ],
              
              // 선택 옵션: response_format
              response_format: { type: 'json_object' },
          });

          // ✨ 1단계: 응답 텍스트가 존재하는지 안전하게 확인
          // const rawJson = completion.choices[0]?.message?.content;

          // ✨ 1. AI 응답 원본 로그
          console.log('--- OpenAI Raw Response ---');
          console.log(completion); 
          
          // ✨ 2. rawJson 값 로그
          const rawJson = completion.choices[0]?.message?.content;
          console.log('--- Raw JSON Content ---');
          console.log(rawJson);
          
          // rawJson이 없거나, JSON 파싱이 불가능할 경우를 대비해 빈 객체({})를 반환
          const parsedContent = rawJson ? JSON.parse(rawJson) : {}; 
          
          // ✨ 2단계: 'hashtags' 필드가 문자열인지 안전하게 확인 후 split
          const hashtagsString = parsedContent.hashtags || ''; // hashtags가 없으면 빈 문자열로 대체
          
          // hashtagsString이 빈 문자열이면 split 결과는 ['']
          const hashtagsArray = hashtagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

          // ✨ 3단계: caption이 없을 경우 대비
          const caption = parsedContent.caption || '';
          
          return {
              caption: caption,
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
      .populate('userId', 'username') // 'User' 모델을 참조하여 닉네임 필드만 가져옴
      .sort({ createdAt: -1 }) // 최신순 정렬
      .exec();
  }

  // 4. 본인이 작성한 피드 목록 조회
  async findMyPosts(userId: string): Promise<Post[]> {
    return this.postModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('userId', 'username') // 'User' 모델을 참조하여 닉네임 필드만 가져옴
      .sort({ createdAt: -1 }) // 최신순 정렬
      .exec();
  }
}