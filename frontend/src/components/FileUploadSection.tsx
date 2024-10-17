import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface FileUploadSectionProps {
  handleFileUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: "letter" | "invoice"
  ) => Promise<void>;
  letterFile: File | null;
  invoiceFile: File | null;
}

export function FileUploadSection({
  handleFileUpload,
  letterFile,
  invoiceFile,
}: FileUploadSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="letterUpload">Upload Engagement Letter</Label>
        <div className="mt-2">
          <input
            id="letterUpload"
            type="file"
            onChange={(e) => handleFileUpload(e, "letter")}
            className="hidden"
          />
          <Button
            onClick={() => document.getElementById("letterUpload")?.click()}
          >
            {letterFile ? letterFile.name : "Choose Letter File"}
          </Button>
        </div>
      </div>
      <div>
        <Label htmlFor="invoiceUpload">Upload Invoice</Label>
        <div className="mt-2">
          <input
            id="invoiceUpload"
            type="file"
            onChange={(e) => handleFileUpload(e, "invoice")}
            className="hidden"
          />
          <Button
            onClick={() => document.getElementById("invoiceUpload")?.click()}
          >
            {invoiceFile ? invoiceFile.name : "Choose Invoice File"}
          </Button>
        </div>
      </div>
    </div>
  );
}
