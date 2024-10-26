import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { AIProvider } from './types';
import { FilesService } from '../files/files.service';

interface ContentBlock {
  type: string;
  text: string;
}

export interface SuspiciousItem {
  itemNumber: string;
  description: string;
  name: string;
  rate: string;
  quantity: string;
  totalCost: string;
  reason: string;
  confidence: string;
}

@Injectable()
export class AnalysisService {
  private anthropic: Anthropic;
  private openai: OpenAI;

  constructor(private filesService: FilesService) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeFarb(
    letterText: string,
    invoiceText: string,
    amendmentText: string | null,
    provider: AIProvider = AIProvider.ANTHROPIC,
  ): Promise<{ analysis: string; suspiciousItems: SuspiciousItem[] }> {
    try {
      console.log(`Invoice text length in prompt: ${invoiceText.length}`);

      // Get system prompt from FilesService
      const systemPromptContent = await this.filesService.getWhitePaperText();

      // Using your existing userPromptContent
      const userPromptContent = `Analyze these legal documents based on FARB principles:

Engagement Letter: ${letterText}
Invoice: ${invoiceText}
${amendmentText ? `Amendment: ${amendmentText}` : ''}

Provide a detailed and comprehensive analysis with the following structure:


1. EXECUTIVE SUMMARY:
  - Summarize key findings and major issues identified
  - Provide key financial figures: total billed, total billed by resource, estimated overcharges, potential savings
  - List 3-5 immediate "Action Items" for invoice reviewer to address with the client or the subject law firm


2. DOCUMENT ANALYSIS:
  a. ENGAGEMENT LETTER ANALYSIS:
     - Identify key terms including hourly rates, resource, billing caps, flat rate agreements, and scope of services
     - Flag any unusual or potentially problematic clauses
  b. INVOICE ANALYSIS:
     - Summarize each invoice: date, total amount by resource, total invoice amount, key issues
     - Identify trends or patterns across invoices
  c. AMENDMENT ANALYSIS (if applicable):
     - Analyze how the engagement letter amendment modifies the original engagement letter terms
     - Assess its impact on billing practices
  d. DOCUMENT DISCREPANCIES:
     - Highlight inconsistencies between engagement letter, invoices, and amendment
     - Recommend specific areas for invoice reviewer to investigate further


3. FAIRNESS OF CHARGES:
  - Evaluate the reasonableness of the fees charged
  - Compare similar tasks across invoices and between different attorneys and non-attorney resources
  - Identify any excessive or unjustified charges
  - Analyze the billing rates and time spent on tasks
  - Provide percentage of entries flagged as potentially unfair
  - Recommend specific charges for invoice reviewer to challenge or negotiate


4. ACCURACY OF BILLING DETAILS:
  - Verify the mathematical accuracy of the invoice
  - Check for any duplicate charges or billing errors
  - Assess the clarity and specificity of the billing entries
  - Identify any vague or ambiguous time entries
  - Provide percentage of entries with accuracy issues and total dollar amount affected
  - Highlight specific entries for invoice reviewer to request clarification, correction or follow up on


5. REFLECTIVENESS OF WORK DESCRIPTIONS:
  - Evaluate how well the descriptions match the invoiced work
  
  - Assess the level of detail in the work descriptions
  - Flag any entries that lack sufficient explanation
  - Include 2-3 direct quotes from invoices for each issue identified, with explanations
  - Provide percentage of entries with reflectiveness issues
  - Suggest specific entries for invoice reviewer to request more detailed descriptions


6. BILLING INTEGRITY:
  - Analyze the overall consistency of the billing practices
  - Identify any patterns of questionable billing
  - Evaluate compliance with ethical billing standards
  - Assess any potential conflicts of interest
  - Analyze trends in billing practices over time
  - Provide percentage of entries raising integrity concerns
  - Recommend specific billing practices for invoice reviewer to address with the subject law firm


7. CLIENT-SPECIFIC RECOMMENDATIONS:
  - Provide tailored, actionable recommendations for addressing each major issue
  - For each recommendation, include:
    a) The specific problem it addresses
    b) The potential impact on the client's bill
    c) A step-by-step guide for invoice reviewer to implement the recommendation
  - Prioritize recommendations based on potential financial impact and ease of implementation


8. PREVENTATIVE STRATEGIES:
  - Suggest modifications to the engagement letter to prevent future issues
  - Propose specific billing guidelines for the client to implement with the subject law firm that address issues discovered in the invoices
  - Recommend process improvements for client implementation for ongoing billing management
  - Provide a template or key points for invoice reviewer to discuss future billing expectations with the subject law firm


9. FINANCIAL IMPACT ANALYSIS:
  - Estimate total potential overcharges
  - Break down overcharges by category (e.g., excessive time, improper staffing, etc.)
  - Calculate potential savings from implementing recommendations
  - Provide a range of potential outcomes (best case, worst case, most likely)


10. FARB RATING:
   - Assign a FARB rating (1-10) based on the overall fairness, accuracy, reflectiveness, and billing integrity
   - Explain the rationale behind the rating
   - Compare to industry benchmarks if available


11. ANALYSIS LIMITATIONS AND NEXT STEPS:
   - Acknowledge any limitations in the analysis due to incomplete information
   - Suggest additional documents or information that could enhance the analysis
   - Recommend next steps for invoice reviewer to take based on this analysis


12. CONCLUSION:
   - Summarize the most critical findings and their potential impact
   - Reiterate the top 3-5 priorities for invoice reviewer to address
   - Provide a final assessment of the overall billing practices


Ensure each section starts with its title in all caps, followed by a colon. Provide detailed explanations and specific examples where possible. Your analysis should be based entirely on the information provided in these specific documents, without making assumptions about general industry practices or standards not mentioned in the materials given.


SUSPICIOUS ITEMS:
After the analysis, identify and list the top 15-20 most suspicious line items from the invoice, in the order they appear in the document. If there are fewer than 15 suspicious items, list all of them. For each suspicious item, provide the following details on a single line, separated by pipes (|):
1. Item number (as it appears in the invoice)
2. Description (exact text from the document)
3. Name (if applicable)
4. Rate (if applicable)
5. Quantity (if applicable)
6. Line Total/Total Cost
7. Reason for being flagged as suspicious
8. Confidence level (High, Medium, Low)


Format each item as:
"Item # | Description | Name | Rate | Quantity | Total Cost | Reason | Confidence"


If any field is not applicable or not available, use "N/A". Only include items that are genuinely suspicious based on the FARB principles and the provided documents. If there are no suspicious items, write "None found." after "SUSPICIOUS ITEMS:".`;

      let content: string;

      if (provider === AIProvider.ANTHROPIC) {
        const message = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 8192,
          temperature: 0,
          system: systemPromptContent,
          messages: [
            {
              role: 'user',
              content: userPromptContent,
            },
          ],
        });
        content = (message.content[0] as ContentBlock).text;
        console.log(
          'Anthropic API Response:',
          JSON.stringify(message, null, 2),
        );
      } else if (provider === AIProvider.OPENAI) {
        const response = await this.openai.chat.completions.create({
          model: 'o1-preview',
          messages: [
            {
              role: 'user',
              content: `${systemPromptContent}\n\n${userPromptContent}`,
            },
          ],
        });
        console.log('OpenAI API Response:', JSON.stringify(response, null, 2));
        content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Unexpected response format from OpenAI API');
        }
      } else {
        throw new Error('Unknown AI provider');
      }

      // Add content logging
      console.log('Processed Content:', {
        fullContent: content,
        splitContent: {
          analysis: content.split('SUSPICIOUS ITEMS:')[0],
          suspiciousItems: content.split('SUSPICIOUS ITEMS:')[1],
        },
      });

      const [analysisText, suspiciousItemsText] =
        content.split('SUSPICIOUS ITEMS:');
      if (!analysisText) {
        throw new Error('Unexpected response format: missing analysis');
      }

      const analysis = analysisText.trim();

      // Ensure each section starts with its title in all caps, followed by a colon
      const formattedAnalysis = [
        'EXECUTIVE SUMMARY:',
        'DOCUMENT ANALYSIS:',
        'FAIRNESS OF CHARGES:',
        'ACCURACY OF BILLING DETAILS:',
        'REFLECTIVENESS OF WORK DESCRIPTIONS:',
        'BILLING INTEGRITY:',
        'CLIENT-SPECIFIC RECOMMENDATIONS:',
        'PREVENTATIVE STRATEGIES:',
        'FINANCIAL IMPACT ANALYSIS:',
        'FARB RATING:',
        'ANALYSIS LIMITATIONS AND NEXT STEPS:',
        'CONCLUSION:',
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

      const suspiciousItems =
        suspiciousItemsText.trim() === 'None found.'
          ? []
          : suspiciousItemsText
              .trim()
              .split('\n')
              .filter((item) => item.trim() !== '')
              .map((item) => {
                const [
                  itemNumber,
                  description,
                  name,
                  rate,
                  quantity,
                  totalCost,
                  reason,
                  confidence,
                ] = item.split('|').map((s) => s.trim());
                if (
                  !itemNumber ||
                  !description ||
                  !name ||
                  !totalCost ||
                  !reason ||
                  !confidence
                ) {
                  console.warn(
                    `Potentially invalid suspicious item format: ${item}`,
                  );
                  return null;
                }
                return {
                  itemNumber,
                  description,
                  name,
                  rate,
                  quantity,
                  totalCost,
                  reason,
                  confidence,
                };
              })
              .filter((item): item is SuspiciousItem => item !== null);

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
