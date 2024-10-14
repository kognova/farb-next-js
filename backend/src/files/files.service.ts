import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
export class FilesService {
  private uploadRoot = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureUploadsFolderExists();
  }

  private ensureUploadsFolderExists() {
    if (!fs.existsSync(this.uploadRoot)) {
      fs.mkdirSync(this.uploadRoot);
    }
  }

  private getUserUploadPath(username: string): string {
    const userPath = path.join(this.uploadRoot, username);
    if (!fs.existsSync(userPath)) {
      fs.mkdirSync(userPath);
    }
    return userPath;
  }

  async handleFileUpload(file: Express.Multer.File, username: string) {
    const userPath = this.getUserUploadPath(username);

    // Move the file to the user's directory with the original filename
    const oldPath = file.path;
    const newPath = path.join(userPath, file.originalname);
    await fs.move(oldPath, newPath, { overwrite: true });

    return {
      message: 'File uploaded successfully',
      filename: file.originalname,
    };
  }

  getUploadedFiles(username: string) {
    const userPath = this.getUserUploadPath(username);
    if (!fs.existsSync(userPath)) {
      return [];
    }
    const files = fs.readdirSync(userPath);
    return files.filter((file) => file.endsWith('.pdf'));
  }

  async getFile(filename: string, username: string): Promise<string> {
    const userPath = this.getUserUploadPath(username);
    const filePath = path.join(userPath, filename);
    if (!(await fs.pathExists(filePath))) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }
    return filePath;
  }

  async extractTextFromPdf(
    filename: string,
    username: string,
  ): Promise<string> {
    const filePath = await this.getFile(filename, username);
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await require('pdf-parse')(dataBuffer);
    return pdfData.text;
  }

  async getWhitePaperText(): Promise<string> {
    const filePath = path.join(process.cwd(), 'whitepaper.md');
    if (!(await fs.pathExists(filePath))) {
      throw new HttpException('Whitepaper not found', HttpStatus.NOT_FOUND);
    }
    const whitepaperContent = await fs.readFile(filePath, 'utf-8');

    return `You are an AI assistant specialized in legal billing analysis using the FARB (Fair, Accurate, Reflective, Billing) framework. Your task is to analyze the provided engagement letter and invoice based on the FARB principles outlined in this whitepaper:

${whitepaperContent}

Please provide a detailed analysis of the invoice, considering the terms set in the engagement letter. Focus on:
1. Fairness of the charges
2. Accuracy of the billing details
3. How well the descriptions reflect the work done
4. Overall billing integrity

Highlight any discrepancies or areas of concern, and provide recommendations for the client. Be thorough but concise in your analysis.`;
  }
}
