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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Upload,
  AlertCircle,
  Printer,
  Download,
  PlusCircle,
  Trash2,
  Share2,
} from "lucide-react";
import axios from "@/lib/axios";
import { LoginForm } from "./LoginForm";
import { AnalysisResult } from "./AnalysisResult";
import { ErrorMessage } from "./ErrorMessage";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { PDFViewer } from "@/components/PDFViewer";
import { LoadingIndicator } from "./LoadingIndicator";

const API_BASE_URL = "http://localhost:3001";

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

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/status`);
      setIsLoggedIn(response.data.isLoggedIn);
    } catch (error) {
      console.error("Error checking login status:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
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
      await axios.post(`${API_BASE_URL}/auth/logout`);
      setIsLoggedIn(false);
      setUploadedFiles([]);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const fetchUploadedFiles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/files`);
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
        setIsExtracting((prev) => ({ ...prev, [fileType]: true }));
        await axios.post(`${API_BASE_URL}/files/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        switch (fileType) {
          case "letter":
            setLetterFiles((prev) => [...prev, ...fileArray]);
            break;
          case "invoice":
            setInvoiceFiles((prev) => [...prev, ...fileArray]);
            break;
          case "amendment":
            setAmendmentFiles((prev) => [...prev, ...fileArray]);
            break;
        }

        // Extract text immediately after upload
        const extractedTextContent = await extractTextFromFile(
          fileArray[0].name
        );
        setExtractedText((prev) => ({
          ...prev,
          [fileType]: extractedTextContent,
        }));
      } catch (error) {
        console.error("File upload or text extraction error:", error);
        setError("File upload or text extraction failed. Please try again.");
      } finally {
        setIsExtracting((prev) => ({ ...prev, [fileType]: false }));
      }
    }
  };

  const extractTextFromFile = async (filename: string) => {
    const response = await axios.get(
      `${API_BASE_URL}/files/extract/${filename}`
    );
    return response.data.text;
  };

  const removeFile = (
    index: number,
    fileType: "letter" | "invoice" | "amendment"
  ) => {
    switch (fileType) {
      case "letter":
        setLetterFiles((prev) => prev.filter((_, i) => i !== index));
        break;
      case "invoice":
        setInvoiceFiles((prev) => prev.filter((_, i) => i !== index));
        break;
      case "amendment":
        setAmendmentFiles((prev) => prev.filter((_, i) => i !== index));
        break;
    }
  };

  const handleAnalyze = async () => {
    if (!extractedText.letter || !extractedText.invoice) {
      setError("Please upload both engagement letter and invoice files.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setProgress(0);
    try {
      const response = await axios.post(`${API_BASE_URL}/analysis`, {
        letterText: extractedText.letter,
        invoiceText: extractedText.invoice,
        amendmentText: extractedText.amendment || "",
      });
      setAnalysisResult({
        analysis: response.data.analysis,
        suspiciousItems: response.data.suspiciousItems,
      });
      setProgress(100);
    } catch (err) {
      setError(
        "An error occurred during the analysis. Please try again or contact support."
      );
      console.error("Analysis error:", err);
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
    (item) =>
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

  const isAnalysisDisabled = () => {
    return (
      letterFiles.length === 0 ||
      invoiceFiles.length === 0 ||
      isLoading ||
      isExtracting.letter ||
      isExtracting.invoice ||
      isExtracting.amendment ||
      !extractedText.letter ||
      !extractedText.invoice
    );
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
          <header className="mb-4">
            <h1 className="text-3xl font-bold text-primary">
              FARB365: Legal Invoice Transparency and Analysis
            </h1>
          </header>

          <Card className="mb-4">
            <CardHeader className="py-2">
              <CardTitle className="text-lg font-semibold">
                Document Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: "Engagement Letter",
                    files: letterFiles,
                    type: "letter",
                  },
                  {
                    label: "Invoice Documents",
                    files: invoiceFiles,
                    type: "invoice",
                  },
                  {
                    label: "Engagement Letter Amendments",
                    files: amendmentFiles,
                    type: "amendment",
                  },
                ].map(({ label, files, type }) => (
                  <div key={type} className="flex-1 min-w-[200px]">
                    <Label
                      htmlFor={`${type}Upload`}
                      className="text-sm font-medium"
                    >
                      {label}
                    </Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <Input
                        id={`${type}Upload`}
                        type="file"
                        accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                        onChange={(e) =>
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
                    {files.map((file, index) => (
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
                  <AnalysisResult
                    result={analysisResult.analysis}
                    suspiciousItems={analysisResult.suspiciousItems}
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
