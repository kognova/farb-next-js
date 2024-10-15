import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

interface ContentBlock {
  type: string;
  text: string;
}

@Injectable()
export class AnalysisService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async analyzeFarb(
    letterText: string,
    invoiceText: string,
    amendmentText: string | null,
    systemPrompt: string,
  ): Promise<string> {
    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Analyze these documents based on FARB principles:

Engagement Letter:
${letterText}

Invoice:
${invoiceText}

${
  amendmentText
    ? `Amendment:
${amendmentText}

`
    : ''
}
Provide a detailed analysis focusing on:
1. Fairness of charges
2. Accuracy of billing details
3. Reflectiveness of work descriptions
4. Overall billing integrity

Highlight discrepancies and provide recommendations.`,
          },
        ],
      });

      console.log('API Response:', message);
      const content = message.content[0] as ContentBlock;
      return content.text;
    } catch (error) {
      console.error('Anthropic API Error:', error);
      throw new HttpException(
        `Error communicating with Anthropic API: ${JSON.stringify(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
