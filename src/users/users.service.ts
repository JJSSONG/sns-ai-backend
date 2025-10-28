// src/users/users.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto'; // 다음 단계에서 생성 예정

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // 1. 사용자 ID (username)로 사용자 찾기
  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
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
}