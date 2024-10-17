import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  AlertCircle,
  Info,
  CheckCircle,
  DollarSign,
  FileText,
  Briefcase,
  FileSearch,
  AlertTriangle,
  BarChart,
  UserCog,
  Shield,
  TrendingUp,
  Star,
  HelpCircle,
  Flag,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SuspiciousItem } from "./FARB365Frontend";

interface AnalysisResultProps {
  result: string;
  suspiciousItems: SuspiciousItem[];
}

export function AnalysisResult({
  result = "No analysis available",
  suspiciousItems = [],
}: AnalysisResultProps) {
  // Preprocess the result string to remove line numbers
  const cleanedResult = result.replace(/^\d+\|/gm, "");

  const sectionIcons: { [key: string]: React.ReactNode } = {
    "EXECUTIVE SUMMARY:": <Info className="h-5 w-5 text-blue-500" />,
    "DOCUMENT ANALYSIS:": <FileSearch className="h-5 w-5 text-purple-500" />,
    "FAIRNESS OF CHARGES:": <DollarSign className="h-5 w-5 text-green-500" />,
    "ACCURACY OF BILLING DETAILS:": (
      <CheckCircle className="h-5 w-5 text-yellow-500" />
    ),
    "REFLECTIVENESS OF WORK DESCRIPTIONS:": (
      <FileText className="h-5 w-5 text-indigo-500" />
    ),
    "BILLING INTEGRITY:": <Briefcase className="h-5 w-5 text-red-500" />,
    "CLIENT-SPECIFIC RECOMMENDATIONS:": (
      <UserCog className="h-5 w-5 text-pink-500" />
    ),
    "PREVENTATIVE STRATEGIES:": <Shield className="h-5 w-5 text-cyan-500" />,
    "FINANCIAL IMPACT ANALYSIS:": (
      <TrendingUp className="h-5 w-5 text-orange-500" />
    ),
    "FARB RATING:": <Star className="h-5 w-5 text-yellow-500" />,
    "ANALYSIS LIMITATIONS AND NEXT STEPS:": (
      <HelpCircle className="h-5 w-5 text-gray-500" />
    ),
    "CONCLUSION:": <Flag className="h-5 w-5 text-green-500" />,
  };
  const defaultIcon = <AlertCircle className="h-5 w-5 text-gray-500" />;

  const renderAnalysisSection = (
    title: string,
    content: string,
    icon: React.ReactNode
  ) => (
    <Collapsible
      key={title}
      className="mb-4"
      defaultOpen={title === "EXECUTIVE SUMMARY:"}
    >
      <CollapsibleTrigger className="flex items-center w-full p-2 bg-gray-100 rounded-t-md">
        {icon}
        <h3 className="text-lg font-semibold ml-2 flex-grow">{title}</h3>
        <ChevronDown className="h-5 w-5" />
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 border border-t-0 rounded-b-md">
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
      </CollapsibleContent>
    </Collapsible>
  );

  const renderAnalysis = () => {
    const sections = [
      "EXECUTIVE SUMMARY:",
      "DOCUMENT ANALYSIS:",
      "FAIRNESS OF CHARGES:",
      "ACCURACY OF BILLING DETAILS:",
      "REFLECTIVENESS OF WORK DESCRIPTIONS:",
      "BILLING INTEGRITY:",
      "CLIENT-SPECIFIC RECOMMENDATIONS:",
      "PREVENTATIVE STRATEGIES:",
      "FINANCIAL IMPACT ANALYSIS:",
      "FARB RATING:",
      "ANALYSIS LIMITATIONS AND NEXT STEPS:",
      "CONCLUSION:",
    ];

    return sections.map((section, index) => {
      const nextSection = sections[index + 1];

      let sectionRegex;
      if (nextSection) {
        sectionRegex = new RegExp(
          `^\\s*(?:\\d+\\.?\\)?\\s*)?${section}\\s*([\\s\\S]*?)(?=^\\s*(?:\\d+\\.?\\)?\\s*)?${nextSection})`,
          "im"
        );
      } else {
        sectionRegex = new RegExp(
          `^\\s*(?:\\d+\\.?\\)?\\s*)?${section}\\s*([\\s\\S]*)`,
          "im"
        );
      }

      const match = cleanedResult.match(sectionRegex);
      const content = match ? match[1].trim() : "No information available.";
      const icon = sectionIcons[section] || defaultIcon;
      return renderAnalysisSection(section, content, icon);
    });
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Detailed FARB365 Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[700px] scroll-area">
            <div className="space-y-4">{renderAnalysis()}</div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Suspicious Items</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] scroll-area">
            {suspiciousItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suspiciousItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.rate}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.totalCost}</TableCell>
                      <TableCell>{item.reason}</TableCell>
                      <TableCell>{item.confidence}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p>No suspicious items found.</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
