"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, PlusCircle, Trash2, Share2 } from "lucide-react";
import axios from "@/lib/axios";
import { LoginForm } from "./LoginForm";
import { AnalysisResult } from "./AnalysisResult";
import { ErrorMessage } from "./ErrorMessage";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { PDFViewer } from "@/components/PDFViewer";
import { LoadingIndicator } from "./LoadingIndicator";
import { AIProvider, SuspiciousItem } from "../analysis/types"; // Adjust the path if necessary
import AnalysisControls from "./AnalysisControls";

export default function FARB365Frontend() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [letterFiles, setLetterFiles] = useState<File[]>([]);
  const [invoiceFiles, setInvoiceFiles] = useState<File[]>([]);
  const [amendmentFiles, setAmendmentFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [extractedText, setExtractedText] = useState<{
    letter?: string;
    invoice?: string;
    amendment?: string;
  }>({});
  const [analysisResult, setAnalysisResult] = useState<{
    analysis: string;
    suspiciousItems: SuspiciousItem[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isExtracting, setIsExtracting] = useState<{
    letter: boolean;
    invoice: boolean;
    amendment: boolean;
  }>({ letter: false, invoice: false, amendment: false });
  const [provider, setProvider] = useState<AIProvider>(AIProvider.ANTHROPIC);
  const [isInvoiceOnly, setIsInvoiceOnly] = useState(false);
  const [isAnalysisMinimized, setIsAnalysisMinimized] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (isInvoiceOnly) {
      setIsAnalysisMinimized(true);
    }
  }, [isInvoiceOnly]);

  const checkLoginStatus = async () => {
    try {
      const response = await axios.get(`auth/status`);
      setIsLoggedIn(response.data.isLoggedIn);
    } catch (error) {
      console.error("Error checking login status:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await axios.post(`auth/login`, {
        username,
        password,
      });
      console.log("Login response:", response.data);
      setIsLoggedIn(true);
      fetchUploadedFiles();
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please check your credentials.");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`auth/logout`);
      setIsLoggedIn(false);
      setUploadedFiles([]);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const fetchUploadedFiles = async () => {
    try {
      const response = await axios.get(`files`);
      setUploadedFiles(response.data);
    } catch (error) {
      console.error("Error fetching uploaded files:", error);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: "letter" | "invoice" | "amendment"
  ) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const formData = new FormData();
      fileArray.forEach((file) => formData.append("file", file));

      try {
        setIsExtracting((prev: any) => ({ ...prev, [fileType]: true }));
        await axios.post(`files/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        switch (fileType) {
          case "letter":
            setLetterFiles((prev: any) => [...prev, ...fileArray]);
            break;
          case "invoice":
            setInvoiceFiles((prev: any) => [...prev, ...fileArray]);
            break;
          case "amendment":
            setAmendmentFiles((prev: any) => [...prev, ...fileArray]);
            break;
        }

        // Extract text immediately after upload
        const extractedTextContent = await extractTextFromFile(
          fileArray[0].name
        );
        setExtractedText((prev: any) => ({
          ...prev,
          [fileType]: extractedTextContent,
        }));
      } catch (error) {
        console.error("File upload or text extraction error:", error);
        setError("File upload or text extraction failed. Please try again.");
      } finally {
        setIsExtracting((prev: any) => ({
          ...prev,
          [fileType]: false,
        }));
      }
    }
  };

  const extractTextFromFile = async (filename: string) => {
    const response = await axios.get(`files/extract/${filename}`);
    return response.data.text;
  };

  const removeFile = (
    index: number,
    fileType: "letter" | "invoice" | "amendment"
  ) => {
    switch (fileType) {
      case "letter":
        setLetterFiles((prev: any[]) =>
          prev.filter((_: any, i: number) => i !== index)
        );
        break;
      case "invoice":
        setInvoiceFiles((prev: any[]) =>
          prev.filter((_: any, i: number) => i !== index)
        );
        break;
      case "amendment":
        setAmendmentFiles((prev: any[]) =>
          prev.filter((_: any, i: number) => i !== index)
        );
        break;
    }
  };

  const handleModeSwitch = () => {
    const newInvoiceOnly = !isInvoiceOnly;
    setIsInvoiceOnly(newInvoiceOnly);
    if (newInvoiceOnly) {
      setIsAnalysisMinimized(true);
    }
  };

  const isAnalysisDisabled = () => {
    const baseChecks =
      invoiceFiles.length === 0 ||
      isLoading ||
      isExtracting.invoice ||
      !extractedText.invoice;

    if (isInvoiceOnly) {
      return baseChecks;
    }

    return (
      baseChecks ||
      letterFiles.length === 0 ||
      isExtracting.letter ||
      !extractedText.letter
    );
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setProgress(0);

    try {
      const payload = {
        invoiceText: extractedText.invoice,
        provider: provider,
        // ALWAYS send letterText, but use empty string if in invoice-only mode
        letterText: isInvoiceOnly ? "" : extractedText.letter || "",
        // Only include amendmentText if we have it and not in invoice-only mode
        ...(!isInvoiceOnly &&
          extractedText.amendment && {
            amendmentText: extractedText.amendment,
          }),
      };

      const response = await axios.post("/analysis", payload, {
        onDownloadProgress: (progressEvent) => {
          const totalLength = progressEvent.total;
          if (totalLength) {
            setProgress(Math.round((progressEvent.loaded * 100) / totalLength));
          }
        },
      });

      setAnalysisResult(response.data);
    } catch (error) {
      setError("An error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareAnalysis = async () => {
    if (!analysisResult) {
      setError("No analysis available to share.");
      return;
    }

    const contentToShare = `
FARB365 Analysis Result

Documents Analyzed:
1. Engagement Letter: ${letterFiles[0]?.name || "Not provided"}
2. Invoice: ${invoiceFiles[0]?.name || "Not provided"}
3. Engagement Amendment: ${amendmentFiles[0]?.name || "Not provided"}

Detailed FARB365 Analysis:
${analysisResult.analysis}

Suspicious Items:
${analysisResult.suspiciousItems
  .map(
    (item: {
      itemNumber: any;
      description: any;
      name: any;
      rate: any;
      quantity: any;
      totalCost: any;
      reason: any;
      confidence: any;
    }) =>
      `Item #: ${item.itemNumber}
Description: ${item.description}
Name: ${item.name}
Rate: ${item.rate}
Quantity: ${item.quantity}
Total Cost: ${item.totalCost}
Reason: ${item.reason}
Confidence: ${item.confidence}
`
  )
  .join("\n")}
`;

    try {
      await navigator.clipboard.writeText(contentToShare);
      alert("Analysis content copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy content:", err);
      setError("Failed to copy analysis content. Please try again.");
    }
  };

  const handleExportReport = async () => {
    if (!analysisResult) {
      setError("No analysis available to export.");
      return;
    }

    const element = document.getElementById("analysis-result");

    if (element) {
      try {
        const pdf = new jsPDF("p", "pt", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Set a temporary style to expand all scrollable areas
        const scrollAreas = element.querySelectorAll(".scroll-area");
        const originalStyles = Array.from(scrollAreas).map((area) => ({
          height: (area as HTMLElement).style.height,
          overflow: (area as HTMLElement).style.overflow,
        }));

        scrollAreas.forEach((area) => {
          (area as HTMLElement).style.height = "auto";
          (area as HTMLElement).style.overflow = "visible";
        });

        // Add document names to the first page
        pdf.setFontSize(14);
        pdf.text("FARB365 Analysis Report", 40, 40);
        pdf.setFontSize(12);
        pdf.text(
          `Engagement Letter: ${letterFiles[0]?.name || "Not provided"}`,
          40,
          70
        );
        pdf.text(`Invoice: ${invoiceFiles[0]?.name || "Not provided"}`, 40, 90);
        pdf.text(
          `Engagement Amendment: ${amendmentFiles[0]?.name || "Not provided"}`,
          40,
          110
        );

        let yOffset = 140;

        // Function to add a section to the PDF
        const addSection = async (sectionElement: Element) => {
          const canvas = await html2canvas(sectionElement as HTMLElement, {
            scale: 2,
            logging: false,
            useCORS: true,
          });

          const imgData = canvas.toDataURL("image/png");
          const imgWidth = pdfWidth - 80; // Add some margin
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (yOffset + imgHeight > pdfHeight) {
            pdf.addPage();
            yOffset = 40; // Reset yOffset for the new page
          }

          pdf.addImage(imgData, "PNG", 40, yOffset, imgWidth, imgHeight);
          yOffset += imgHeight + 20; // Add some space between sections
        };

        // Add each section separately
        for (let i = 0; i < element.children.length; i++) {
          await addSection(element.children[i]);
        }

        // Reset the style of scrollable areas
        scrollAreas.forEach((area, index) => {
          (area as HTMLElement).style.height = originalStyles[index].height;
          (area as HTMLElement).style.overflow = originalStyles[index].overflow;
        });

        pdf.save("FARB365_Analysis_Report.pdf");
      } catch (err) {
        console.error("Failed to generate PDF:", err);
        setError("Failed to generate PDF report. Please try again.");
      }
    } else {
      setError("Analysis result not found. Please try again.");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-full bg-background text-foreground">
      {!isLoggedIn ? (
        <LoginForm
          handleLogin={handleLogin}
          setUsername={setUsername}
          setPassword={setPassword}
          error={error}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-primary">
                FARB365: Legal Invoice Transparency and Analysis
              </h1>
              {isInvoiceOnly && (
                <p className="text-sm text-muted-foreground mt-1">
                  Running in invoice-only mode
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleModeSwitch}
              className="ml-4"
            >
              {isInvoiceOnly
                ? "Switch to Full Analysis"
                : "Invoice Only Analysis"}
            </Button>
          </div>

          <Card className="mb-4">
            <CardHeader className="py-2">
              <CardTitle className="text-lg font-semibold">
                Document Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <AnalysisControls
                provider={provider}
                onProviderChange={setProvider}
              />
              <div className="flex flex-wrap gap-2">
                {[
                  // Only show letter and amendment in full analysis mode
                  ...(!isInvoiceOnly
                    ? [
                        {
                          label: "Engagement Letter",
                          files: letterFiles,
                          type: "letter",
                          required: true,
                        },
                        {
                          label: "Engagement Letter Amendments",
                          files: amendmentFiles,
                          type: "amendment",
                          required: false,
                        },
                      ]
                    : []),
                  // Always show invoice
                  {
                    label: "Invoice Documents",
                    files: invoiceFiles,
                    type: "invoice",
                    required: true,
                  },
                ].map(({ label, files, type, required }) => (
                  <div key={type} className="flex-1 min-w-[200px]">
                    <Label
                      htmlFor={`${type}Upload`}
                      className="text-sm font-medium"
                    >
                      {label} {required && "*"}
                    </Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <Input
                        id={`${type}Upload`}
                        type="file"
                        accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                        onChange={(e: any) =>
                          handleFileUpload(
                            e,
                            type as "letter" | "invoice" | "amendment"
                          )
                        }
                        className="flex-grow text-sm h-8"
                        disabled={
                          isExtracting[type as keyof typeof isExtracting]
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document.getElementById(`${type}Upload`)?.click()
                        }
                        className="h-8 w-8 p-0"
                        disabled={
                          isExtracting[type as keyof typeof isExtracting]
                        }
                      >
                        {isExtracting[type as keyof typeof isExtracting] ? (
                          <span className="animate-spin">⌛</span>
                        ) : (
                          <PlusCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {files.map((file: { name: any }, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between mt-1"
                      >
                        <span className="text-xs truncate max-w-[180px]">
                          {file.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeFile(
                              index,
                              type as "letter" | "invoice" | "amendment"
                            )
                          }
                          className="h-6 w-6 p-0"
                          disabled={
                            isExtracting[type as keyof typeof isExtracting]
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {isExtracting[type as keyof typeof isExtracting] && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Extracting text, please wait...
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="py-2">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalysisDisabled()}
                className="w-full h-8"
              >
                {isLoading ? (
                  <>Analyzing...</>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Conduct FARB365 Analysis
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {isLoading && <LoadingIndicator progress={progress} />}

          {error && <ErrorMessage message={error} />}

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/2">
              {analysisResult && (
                <div id="analysis-result">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                      Detailed FARB365 Analysis
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setIsAnalysisMinimized(!isAnalysisMinimized)
                      }
                    >
                      {isAnalysisMinimized ? "Show Analysis" : "Hide Analysis"}
                    </Button>
                  </div>
                  <AnalysisResult
                    result={analysisResult.analysis}
                    suspiciousItems={analysisResult.suspiciousItems}
                    hideAnalysis={isAnalysisMinimized}
                  />
                </div>
              )}
            </div>
            <div className="w-full lg:w-1/2">
              <PDFViewer
                letterFile={letterFiles[0]}
                invoiceFile={invoiceFiles[0]}
                amendmentFile={amendmentFiles[0]}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <Button variant="outline" onClick={handleShareAnalysis}>
              <Share2 className="mr-2 h-4 w-4" />
              Share FARB365 Analysis
            </Button>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export FARB365 Report
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
