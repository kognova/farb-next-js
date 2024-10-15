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
    },
    @Session() session: any,
  ) {
    if (!session.user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      const systemPrompt = await this.filesService.getWhitePaperText();

      console.log(`Received invoice text length: ${body.invoiceText.length}`);

      const { analysis, suspiciousItems } =
        await this.analysisService.analyzeFarb(
          body.letterText,
          body.invoiceText,
          body.amendmentText || null,
          systemPrompt,
        );
      return { analysis, suspiciousItems };
    } catch (error) {
      console.error('Error in analyze:', error);
      throw new HttpException(
        error.message,
        error.getStatus ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
