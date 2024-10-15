import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import { LlamaParseReader } from 'llamaindex';
import 'dotenv/config';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private uploadRoot = path.join(process.cwd(), 'uploads');
  private llamaParser: LlamaParseReader;

  constructor() {
    this.ensureUploadsFolderExists();
    this.llamaParser = new LlamaParseReader({
      apiKey: process.env.LLAMA_CLOUD_API_KEY,
      resultType: 'markdown',
      premiumMode: true,
      parsingInstruction: `The provided document is a legal invoice. Each page contains detailed billing information, including services rendered, hourly rates, time spent, and amounts due. 
    - Extract each line item, including the **service description**, **rate**, **quantity (hours)**, and **line total**.
    - Capture the **invoice number**, **issue date**, **due date**, and **client information** from the header section.
    - Differentiate between **attorney services** and **research services**, associating them with specific individuals (e.g., attorneys or research assistants).
    - Ensure the final **total amount due**, any **paid amounts**, and status (e.g., "FREE OF CHARGE") are captured and structured.
    - Include any free services or discounts provided.
    - Please extract the table with columns: Description, Rate, Hours, and Line Total, and format the output in a consistent Markdown table.
    Use this table structure:

    | Description | Rate  | Qty  | Line Total |
    |-------------|-------|------|------------|
    | [Service]   | $X.XX | X.XX | $X.XX      |`,
    });
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
    this.logger.log(`Extracting text from ${filename} for user ${username}`);
    const filePath = await this.getFile(filename, username);
    try {
      const documents = await this.llamaParser.loadData(filePath);
      this.logger.log(
        `Extracted ${documents.length} documents from ${filename}`,
      );
      this.logger.debug(
        `First document content: ${JSON.stringify(documents[0])}`,
      );
      if (documents.length === 0) {
        throw new Error('No text extracted from the document');
      }
      return documents.map((doc) => doc.text).join('\n\n');
    } catch (error) {
      this.logger.error(`Error extracting text from ${filename}:`, error);
      throw new HttpException(
        `Error extracting text from PDF: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
4. Billing integrity

Highlight any discrepancies or areas of concern, and provide recommendations for the client. Be thorough but concise in your analysis.`;
  }
}
