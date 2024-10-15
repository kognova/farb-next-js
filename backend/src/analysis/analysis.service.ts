import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

interface ContentBlock {
  type: string;
  text: string;
}

export interface SuspiciousItem {
  description: string;
  name: string;
  rate: string;
  quantity: string;
  totalCost: string;
  reason: string;
}

interface AnalysisResultProps {
  result: string;
  suspiciousItems: Array<{
    description: string;
    name: string;
    rate: string;
    quantity: string;
    totalCost: string;
    reason: string;
  }>;
  isConfidentialMode: boolean;
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
  ): Promise<{ analysis: string; suspiciousItems: SuspiciousItem[] }> {
    try {
      console.log(`Invoice text length in prompt: ${invoiceText.length}`);
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 8192, // Increase this value
        temperature: 0,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Analyze these legal documents based on FARB principles:

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
Provide a detailed and comprehensive analysis with the following structure:

1. OVERVIEW:
   - Summarize the key points of the engagement letter, invoice, and amendment (if applicable)
   - Highlight any immediate red flags or areas of concern
   - Provide an overall assessment of the billing practices

2. FAIRNESS OF CHARGES:
   - Evaluate the reasonableness of the fees charged
   - Compare the charges to industry standards or similar cases
   - Identify any excessive or unjustified charges
   - Analyze the billing rates and time spent on tasks

3. ACCURACY OF BILLING DETAILS:
   - Verify the mathematical accuracy of the invoice
   - Check for any duplicate charges or billing errors
   - Assess the clarity and specificity of the billing entries
   - Identify any vague or ambiguous time entries

4. REFLECTIVENESS OF WORK DESCRIPTIONS:
   - Evaluate how well the descriptions match the claimed work
   - Identify any discrepancies between the engagement letter and the actual work performed
   - Assess the level of detail in the work descriptions
   - Flag any entries that lack sufficient explanation

5. BILLING INTEGRITY:
   - Analyze the overall consistency of the billing practices
   - Identify any patterns of questionable billing
   - Evaluate compliance with ethical billing standards
   - Assess any potential conflicts of interest

6. DISCREPANCIES AND RECOMMENDATIONS:
   - Summarize all identified discrepancies and issues
   - Provide specific recommendations for addressing each issue
   - Suggest improvements to the billing practices
   - Outline any potential next steps or areas for further investigation

After the analysis, on a new line, write "SUSPICIOUS ITEMS:".
For each suspicious item, provide the following details on a single line, separated by pipes (|):
1. Description (exact text from the document)
2. Name (if applicable)
3. Rate (if applicable)
4. Quantity (if applicable)
5. Line Total/Total Cost
6. Reason for being flagged as suspicious

Format each item as: "Description | Name | Rate | Quantity | Total Cost | Reason"
If any field is not applicable or not available, use "N/A".
Only include items that are genuinely suspicious based on the FARB principles and the provided documents.
If there are no suspicious items, write "None found." after "SUSPICIOUS ITEMS:".

Ensure each section starts with its title in all caps, followed by a colon. Provide detailed explanations and specific examples where possible.`,
          },
        ],
      });

      const content = message.content[0] as ContentBlock;
      if (content.type !== 'text') {
        throw new Error('Unexpected response format from Anthropic API');
      }

      const [analysisText, suspiciousItemsText] =
        content.text.split('SUSPICIOUS ITEMS:');
      if (!analysisText || !suspiciousItemsText) {
        throw new Error(
          'Unexpected response format: missing analysis or suspicious items',
        );
      }

      const analysis = analysisText.trim();

      // Ensure each section starts with its title in all caps, followed by a colon
      const formattedAnalysis = [
        'OVERVIEW:',
        'FAIRNESS OF CHARGES:',
        'ACCURACY OF BILLING DETAILS:',
        'REFLECTIVENESS OF WORK DESCRIPTIONS:',
        'BILLING INTEGRITY:',
        'DISCREPANCIES AND RECOMMENDATIONS:',
      ]
        .reduce((acc, section, index, array) => {
          const sectionRegex = new RegExp(
            `${section}\\s*([\\s\\S]*?)(?=${
              index < array.length - 1 ? array[index + 1] : 'SUSPICIOUS ITEMS:'
            }|$)`,
            'i',
          );
          const match = analysis.match(sectionRegex);
          return (
            acc +
            `\n\n${section}\n${match ? match[1].trim() : 'No information available.'}`
          );
        }, '')
        .trim();

      const suspiciousItems = suspiciousItemsText
        .trim()
        .split('\n')
        .filter((item) => item !== 'None found.')
        .map((item) => {
          const [description, name, rate, quantity, totalCost, reason] = item
            .split('|')
            .map((s) => s.trim());
          if (!description || !totalCost || !reason) {
            throw new Error(`Invalid suspicious item format: ${item}`);
          }
          return { description, name, rate, quantity, totalCost, reason };
        });

      return { analysis: formattedAnalysis, suspiciousItems };
    } catch (error) {
      console.error('Error in analyzeFarb:', error);
      throw new HttpException(
        'Analysis failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
