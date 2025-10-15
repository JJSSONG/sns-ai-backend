// src/uploads/uploads.service.ts

import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import 'dotenv/config';

@Injectable()
export class UploadsService {
  private s3: S3;

  constructor() {
    this.s3 = new S3({
      region: process.env.AWS_REGION!,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: Date.now().toString() + '-' + file.originalname, // 파일 이름
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // 외부에서 접근 가능하도록 설정
    };

    try {
      const data = await this.s3.upload(params).promise();
      console.log('File uploaded successfully:', data.Location);
      return data.Location; // 업로드된 파일의 URL 반환
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('파일 업로드에 실패했습니다.');
    }
  }
}