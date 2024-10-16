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
  confidence: string;
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
        max_tokens: 8192,
        temperature: 0,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Analyze these legal documents based on FARB principles:

Engagement Letter: ${letterText}
Invoice: ${invoiceText}
${amendmentText ? `Amendment: ${amendmentText}` : ''}

Provide a detailed and comprehensive analysis with the following structure:

1. EXECUTIVE SUMMARY:
   - Summarize key findings and major issues identified
   - Provide key financial figures: total billed, estimated overcharges, potential savings
   - List 3-5 immediate "Action Items" for Michael to address with the client or law firm

2. DOCUMENT ANALYSIS:
   a. ENGAGEMENT LETTER ANALYSIS:
      - Identify key terms including hourly rates, billing caps, flat rate agreements, and scope of services
      - Flag any unusual or potentially problematic clauses
   b. INVOICE ANALYSIS:
      - Summarize each invoice: date, total amount, key issues
      - Identify trends or patterns across invoices
   c. AMENDMENT ANALYSIS (if applicable):
      - Analyze how the amendment modifies the original engagement letter terms
      - Assess its impact on billing practices
   d. DOCUMENT DISCREPANCIES:
      - Highlight inconsistencies between engagement letter, invoices, and amendment
      - Recommend specific areas for Michael to investigate further

3. FAIRNESS OF CHARGES:
   - Evaluate the reasonableness of the fees charged
   - Compare similar tasks across invoices and between different attorneys
   - Identify any excessive or unjustified charges
   - Analyze the billing rates and time spent on tasks
   - Provide percentage of entries flagged as potentially unfair
   - Recommend specific charges for Michael to challenge or negotiate

4. ACCURACY OF BILLING DETAILS:
   - Verify the mathematical accuracy of the invoice
   - Check for any duplicate charges or billing errors
   - Assess the clarity and specificity of the billing entries
   - Identify any vague or ambiguous time entries
   - Provide percentage of entries with accuracy issues and total dollar amount affected
   - Highlight specific entries for Michael to request clarification or correction

5. REFLECTIVENESS OF WORK DESCRIPTIONS:
   - Evaluate how well the descriptions match the claimed work
   - Identify any discrepancies between the engagement letter and the actual work performed
   - Assess the level of detail in the work descriptions
   - Flag any entries that lack sufficient explanation
   - Include 2-3 direct quotes from invoices for each issue identified, with explanations
   - Provide percentage of entries with reflectiveness issues
   - Suggest specific entries for Michael to request more detailed descriptions

6. BILLING INTEGRITY:
   - Analyze the overall consistency of the billing practices
   - Identify any patterns of questionable billing
   - Evaluate compliance with ethical billing standards
   - Assess any potential conflicts of interest
   - Analyze trends in billing practices over time
   - Provide percentage of entries raising integrity concerns
   - Recommend specific billing practices for Michael to address with the law firm

7. CLIENT-SPECIFIC RECOMMENDATIONS:
   - Provide tailored, actionable recommendations for addressing each major issue
   - For each recommendation, include:
     a) The specific problem it addresses
     b) The potential impact on the client's bill
     c) A step-by-step guide for Michael to implement the recommendation
   - Prioritize recommendations based on potential financial impact and ease of implementation

8. PREVENTATIVE STRATEGIES:
   - Suggest modifications to the engagement letter to prevent future issues
   - Propose specific billing guidelines for the client to implement with the law firm
   - Recommend process improvements for ongoing billing management
   - Provide a template or key points for Michael to discuss future billing expectations with the law firm

9. FINANCIAL IMPACT ANALYSIS:
   - Estimate total potential overcharges
   - Break down overcharges by category (e.g., excessive increments, vague entries, inappropriate task delegation)
   - Provide potential savings if all recommendations are implemented
   - Suggest a negotiation strategy for Michael to use in discussions with the law firm

10. FARB RATING:
    - Provide an overall FARB rating (Excellent, Good, Fair, Poor)
    - Include subscores for each FARB principle (Fair, Accurate, Reflective, Billing Integrity) on a scale of 1-10
    - Explain the rationale for each score
    - Clearly state whether the invoice(s) are "Passable" or "Require Further Investigation" under FARB365 standards
    - If "Require Further Investigation", specify which areas need immediate attention
    - Recommend specific areas for the law firm to improve their FARB rating
    - Provide a clear next step for the user based on the rating:
      * For Excellent/Good ratings: Suggest any minor improvements or state that no immediate action is required
      * For Fair/Poor ratings: Advise a deeper review of flagged line items and specify priority areas
    Ensure the next step is clearly labeled with "Clear next step for the user:" followed by the recommendation.

11. ANALYSIS LIMITATIONS AND NEXT STEPS:
    - Identify any areas where additional information or clarification is needed
    - List any limitations due to missing information or unusual circumstances
    - Suggest specific follow-up questions for Michael to ask the client or law firm
    - Recommend areas where deeper expert analysis might be beneficial

12. CONCLUSION:
    Provide a comprehensive conclusion summarizing the most critical findings and their potential impact on the client. Include a clear, prioritized list of next steps for Michael to take, including key discussion points for meetings with the client and law firm. Emphasize how addressing the identified issues can lead to improved billing practices, cost savings, and a stronger attorney-client relationship. Conclude with a statement on how this analysis supports the overall goals of the FARB365 process in ensuring fair, accurate, reflective, and integral billing practices. Ensure this section is clearly labeled as "CONCLUSION:" and contains substantial content.

After the analysis, on a new line, write "SUSPICIOUS ITEMS:". For each suspicious item, provide the following details on a single line, separated by pipes (|):
1. Description (exact text from the document)
2. Name (if applicable)
3. Rate (if applicable)
4. Quantity (if applicable)
5. Line Total/Total Cost
6. Reason for being flagged as suspicious
7. Confidence level (High, Medium, Low)

Format each item as:
"Description | Name | Rate | Quantity | Total Cost | Reason | Confidence"

If any field is not applicable or not available, use "N/A". Only include items that are genuinely suspicious based on the FARB principles and the provided documents. If there are no suspicious items, write "None found." after "SUSPICIOUS ITEMS:".

Ensure each section starts with its title in all caps, followed by a colon. Provide detailed explanations and specific examples where possible. Your analysis should be based entirely on the information provided in these specific documents, without making assumptions about general industry practices or standards not mentioned in the materials given.`,
          },
        ],
      });

      const content = message.content[0] as ContentBlock;
      if (content.type !== 'text') {
        throw new Error('Unexpected response format from Anthropic API');
      }

      const [analysisText, suspiciousItemsText] =
        content.text.split('SUSPICIOUS ITEMS:');
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
                  description,
                  name,
                  rate,
                  quantity,
                  totalCost,
                  reason,
                  confidence,
                ] = item.split('|').map((s) => s.trim());
                if (!description || !totalCost || !reason || !confidence) {
                  console.warn(
                    `Potentially invalid suspicious item format: ${item}`,
                  );
                  return null;
                }
                return {
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
