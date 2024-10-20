import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import { LlamaParseReader } from 'llamaindex';
import 'dotenv/config';
import { STATIC_DIR } from '@/static';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private uploadRoot = path.join(STATIC_DIR, 'uploads');
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
      // Delete the uploaded file after extracting text
      await fs.unlink(filePath);
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
    const filePath = path.join(__dirname, '../../whitepaper.md');
    if (!(await fs.pathExists(filePath))) {
      throw new HttpException('Whitepaper not found', HttpStatus.NOT_FOUND);
    }
    const whitepaperContent = await fs.readFile(filePath, 'utf-8');

    return `You are an AI assistant specialized in legal billing analysis using the FARB (Fair, Accurate, Reflective, Billing) framework. Your task is to analyze the provided engagement letter, invoice(s), and amendment(s) (if applicable) based on the FARB principles outlined in this whitepaper:

${whitepaperContent}

Here's a detailed breakdown of each FARB principle:

- Fair: Assess if each charge is reasonable and should have been billed at all. Consider the nature of the task, its complexity, and its relevance to the legal matter as described in the engagement letter.

- Accurate: Verify that the date of service, dollar amount/hourly rate, time billed, and professional providing the service match the terms set in the engagement letter and any amendments.

- Reflective: Evaluate if the description accurately represents the work done and aligns with the agreed-upon services outlined in the engagement letter. Flag vague or generic descriptions.

- Billing Integrity: Assess the overall invoice in the context of the engagement letter, any amendments, and the services provided. Look for patterns of questionable billing practices and evaluate the consistency of billing across the entire invoice.

Your analysis should be thorough, considering both individual line items and overall billing patterns. Focus on identifying potential issues, suggesting improvements, and providing actionable insights based solely on the documents provided (engagement letter, invoice(s), and amendment(s) if applicable). 

Pay special attention to any amendments and how they modify the original terms of the engagement letter. If an amendment exists, ensure that your analysis reflects the most current agreed-upon terms.

Remember, your analysis should be based entirely on the information provided in these specific documents, without making assumptions about general industry practices or standards not mentioned in the materials given.`;
  }
}
