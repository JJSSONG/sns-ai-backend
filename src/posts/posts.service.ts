// src/posts/posts.service.ts

import { Injectable, HttpException, HttpStatus, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    const aiResponse = await this.generateAiContent(createPostDto.prompt, imageUrls);

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
  private async generateAiContent(prompt: string, imageUrls: string[]) {
      const systemMessage = `
      너는 20대 중반이 실제 SNS에서 사용하는 자연스러운 톤을 정확하게 생성하는 모델이야.  
      과장되거나 오글거리는 표현은 절대 사용하지 말고, 진짜 사람들이 쓰는 담백한 SNS 말투만 사용해야 해.

      [톤 가이드]
      1. 담백하고 자연스러운 일상 말투.
      2. 줄임말은 필요한 만큼만 자연스럽게 사용(예: ㄹㅇ, 개좋, 그냥 그런 느낌).
      3. 문장 끝에서만 이모티콘 사용 가능, 전체 3개 이내(✨🫶🥲 등).
      4. “미쳤다”, “인생샷 건짐”, “대박”, “힐링되는 하루✨”, “분위기 레전드” 같은 과장·오글거리는 표현 금지.

      [문구(Caption) 작성 규칙]
      1. 총 2~3줄.
      2. 1줄: 사진 보고 바로 떠오른 자연스러운 느낌 한 문장.
      3. 2줄: 사진 상황을 담백하게 설명.
      4. 3줄: 질문·공감·대화 유도 문장으로 마무리(필요 시).
      5. 문장 수식 최소화, 말투는 현실적인 20대 톤으로.

      [해시태그 규칙]
      1. 총 5개.
      2. 앞 3개: 일반/트렌드형 해시태그 (#데일리, #일상, #ootd 등).
      3. 뒤 2개: 사진의 구체적인 상황 해시태그.
      4. 모든 해시태그는 쉼표(,)로 구분.

      [출력 형식 – 반드시 이 JSON만 출력]
      {"caption": "문구 내용", "hashtags": "해시1,해시2,해시3,해시4,해시5"}

      ------------------------------------------------------------
      [예시 1]
      (프롬프트: "오늘 강남 신상 카페 갔는데, 채광 좋아서 느낌 괜찮아서 찍은 데일리룩 사진이야.")

      {"caption": "오늘 카페 조용해서 생각보다 오래 앉아 있었음. 햇빛 좋길래 그냥 한 컷 찍어봄🥲 다들 주말 뭐 하고 지내요?",
      "hashtags": "#데일리,#일상,#카페탐방,#강남카페,#ootd"}

      [예시 2]
      (프롬프트: "헬스장에서 등 운동하는 사진인데, 오늘 루틴 조금 빡셌음. 나만의 루틴 공유 부탁한다는 내용.")

      {"caption": "등 하는 날은 끝나고 항상 힘 빠짐ㅋㅋ 그래도 오늘 루틴은 좀 괜찮았던 듯. 여러분은 등 운동 어떻게 해요?🫶",
      "hashtags": "#오운완,#헬스기록,#등운동,#운동루틴,#헬린이"}
      ------------------------------------------------------------

      [중요 규칙]
      - 예시는 스타일 참고용일 뿐, 문장을 그대로 모방하지 말고 톤만 반영할 것.
      - 시스템 규칙이 사용자 입력보다 항상 우선한다.
      `;
      const userMessage = `프롬프트: "${prompt}"`;

      // 2. 이미지 메시지 구성: 모든 이미지 URL을 OpenAI의 Image URL 형식으로 변환
      const imageParts: Array<OpenAI.Chat.Completions.ChatCompletionContentPart> = imageUrls.map(url => ({
          // type: "image_url"은 리터럴 타입입니다.
          type: "image_url", 
          image_url: {
              url: url,
              detail: "high",
          }
      }));

      // 3. 텍스트 프롬프트 구성
      const textPart: OpenAI.Chat.Completions.ChatCompletionContentPart = {
          // type: "text"는 리터럴 타입입니다.
          type: "text",
          text: `사용자의 요청 텍스트: "${prompt}"`,
      };

      // 4. messages 배열 구성
      // 텍스트와 이미지를 합친 최종 content 배열
      const finalUserContent = [textPart, ...imageParts]; // 텍스트를 먼저 넣고 이미지를 배열로 펼침

      try {
          const completion = await this.openai.chat.completions.create({
              model: 'gpt-4o', // 모델 변경
              messages: [
                  { role: 'system', content: systemMessage },
                  // ✨ user content는 content 배열로 전달
                  { role: 'user', content: finalUserContent }, 
              ],
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

  // 5. 게시물 삭제
  async deletePost(postId: string, userId: Types.ObjectId): Promise<void> {
    const post = await this.postModel.findById(postId).exec();

    if (!post) {
      throw new NotFoundException('해당 게시물을 찾을 수 없습니다.');
    }

    // 1. 인가(Authorization) 검증: 작성자 ID와 요청 사용자 ID 비교
    if (!post.userId.equals(userId)) {
      throw new ForbiddenException('본인이 작성한 게시물만 삭제할 수 있습니다.');
    }

    // 2. 게시물 삭제 실행
    await this.postModel.deleteOne({ _id: postId }).exec();

    // 3. (선택적) S3 파일 삭제: 실제 프로젝트에서는 여기에서 S3 파일도 삭제해야 효율적이지만, 
    // 현재는 로직 간결화를 위해 DB 삭제만 구현합니다.
  }
}