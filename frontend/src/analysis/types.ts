export enum AIProvider {
  ANTHROPIC = "anthropic",
  OPENAI = "openai",
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
