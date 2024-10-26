import {
  Controller,
  Post,
  Body,
  Session,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AnalysisService, SuspiciousItem } from './analysis.service';
import { FilesService } from '../files/files.service';
import { AIProvider } from './types';

@Controller('analysis')
export class AnalysisController {
  constructor(
    private analysisService: AnalysisService,
    private filesService: FilesService,
  ) {}

  @Post()
  async analyze(
    @Body()
    body: {
      letterText: string;
      invoiceText: string;
      amendmentText?: string;
      provider: AIProvider;
    },
    @Session() session: any,
  ) {
    if (!session.user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      const { analysis, suspiciousItems } =
        await this.analysisService.analyzeFarb(
          body.letterText,
          body.invoiceText,
          body.amendmentText || null,
          body.provider,
        );
      return { analysis, suspiciousItems };
    } catch (error) {
      console.error('Error in analyze:', error);
      throw new HttpException(
        error.message,
        error.status ? error.status : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
