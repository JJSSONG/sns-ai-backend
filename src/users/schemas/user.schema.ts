// src/users/schemas/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // createdAt, updatedAt 필드를 자동으로 생성
export class User extends Document {
  @Prop({ required: true, unique: true })
  userId: string; // 로그인 ID로 사용 (고유값)

  @Prop({ required: true })
  password: string; // 비밀번호 (해시 저장 예정)

  @Prop({ required: true })
  username: string; // 사용자 이름/닉네임으로 사용

  @Prop({ unique: true, sparse: true, required: false })
  kakaoId: string; // 카카오 로그인 ID
}

export const UserSchema = SchemaFactory.createForClass(User);