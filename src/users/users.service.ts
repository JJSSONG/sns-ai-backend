// src/users/users.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto'; // 다음 단계에서 생성 예정

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // 1. 사용자 ID (userId)로 사용자 찾기
  async findByUserId(userId: string): Promise<User | null> {
    return this.userModel.findOne({ userId }).exec();
  }

  // 2. 새로운 사용자 생성 (비밀번호 해시 적용)
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(createUserDto.password as string, 10); // 솔트 라운드 10

    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword, // 해시된 비밀번호로 저장
    });
    return newUser.save();
  }

  // 3. 카카오 ID로 사용자 찾기 (카카오 로그인 시 필요)
  async findByKakaoId(kakaoId: string): Promise<User | null> {
    return this.userModel.findOne({ kakaoId }).exec();
  }

  // ✨ 4. 기존 사용자에게 kakaoId 업데이트 (연동 로직의 핵심)
  async updateKakaoId(userId: Types.ObjectId, kakaoId: string): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
        userId, // Mongoose ObjectId로 사용자를 찾음
        { kakaoId: kakaoId }, // kakaoId 필드 업데이트
        { new: true } // 업데이트된 문서를 반환하도록 설정
    ).exec();
  }
}