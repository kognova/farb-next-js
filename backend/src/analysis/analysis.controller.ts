import {
  Controller,
  Post,
  Body,
  Session,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AnalysisService } from './analysis.service';
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
      letterFilename: string;
      invoiceFilename: string;
      amendmentFilename?: string;
    },
    @Session() session: any,
  ) {
    if (!session.user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      const username = session.user.username;
      const letterText = await this.filesService.extractTextFromPdf(
        body.letterFilename,
        username,
      );
      const invoiceText = await this.filesService.extractTextFromPdf(
        body.invoiceFilename,
        username,
      );
      const amendmentText = body.amendmentFilename
        ? await this.filesService.extractTextFromPdf(
            body.amendmentFilename,
            username,
          )
        : null;
      const systemPrompt = await this.filesService.getWhitePaperText();

      const analysisResult = await this.analysisService.analyzeFarb(
        letterText,
        invoiceText,
        amendmentText,
        systemPrompt,
      );
      return { analysis: analysisResult };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.getStatus ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
