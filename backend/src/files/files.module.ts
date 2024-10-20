import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { join } from 'path';
import { STATIC_DIR } from '@/static';

@Module({
  imports: [
    MulterModule.register({
      dest: join(STATIC_DIR, 'uploads/temp'),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
