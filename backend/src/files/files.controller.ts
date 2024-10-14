import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  Param,
  Res,
  Session,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { Response } from 'express';

@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Session() session: any,
  ) {
    if (!session.user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return await this.filesService.handleFileUpload(
      file,
      session.user.username,
    );
  }

  @Get()
  getUploadedFiles(@Session() session: any) {
    if (!session.user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return this.filesService.getUploadedFiles(session.user.username);
  }

  @Get(':filename')
  async getFile(
    @Param('filename') filename: string,
    @Res() res: Response,
    @Session() session: any,
  ) {
    if (!session.user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    try {
      const filePath = await this.filesService.getFile(
        filename,
        session.user.username,
      );
      res.sendFile(filePath);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.getStatus ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('extract/:filename')
  async extractText(
    @Param('filename') filename: string,
    @Session() session: any,
  ) {
    if (!session.user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    try {
      const text = await this.filesService.extractTextFromPdf(
        filename,
        session.user.username,
      );
      return { text };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.getStatus ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
