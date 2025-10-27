// src/users/schemas/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // createdAt, updatedAt 필드를 자동으로 생성
export class User extends Document {
  @Prop({ required: true, unique: true })
  username: string; // 로그인 아이디

  @Prop({ required: true })
  password: string; // 비밀번호 (해시 저장 예정)

  @Prop({ required: true })
  nickname: string; // 사용자 이름 (닉네임)

  @Prop({ unique: true, sparse: true }) // 값이 있을 경우에만 유일성 체크
  kakaoId: string; // 카카오 로그인 ID
}

export const UserSchema = SchemaFactory.createForClass(User);