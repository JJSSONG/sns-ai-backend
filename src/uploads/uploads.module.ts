import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';

@Module({
  providers: [UploadsService],
  exports: [UploadsService], // 👈 PostsModule에서 사용할 수 있게 export!
})
export class UploadsModule {}
