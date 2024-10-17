import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PDFViewerProps {
  letterFile: File | null;
  invoiceFile: File | null;
  amendmentFile: File | null;
}

export function PDFViewer({
  letterFile,
  invoiceFile,
  amendmentFile,
}: PDFViewerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [objectURL, setObjectURL] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setObjectURL(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setObjectURL(null);
    }
  }, [selectedFile]);

  useEffect(() => {
    setSelectedFile(letterFile || invoiceFile || amendmentFile || null);
  }, [letterFile, invoiceFile, amendmentFile]);

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-grow flex flex-col pt-4">
        <div className="mb-4">
          <Button
            onClick={() => setSelectedFile(letterFile)}
            disabled={!letterFile}
            className="mr-2"
          >
            Engagement Letter
          </Button>
          <Button
            onClick={() => setSelectedFile(invoiceFile)}
            disabled={!invoiceFile}
            className="mr-2"
          >
            Invoice
          </Button>
          <Button
            onClick={() => setSelectedFile(amendmentFile)}
            disabled={!amendmentFile}
          >
            Amendment
          </Button>
        </div>
        {objectURL && (
          <div className="flex-grow">
            <object
              data={objectURL}
              type={selectedFile?.type || "application/pdf"}
              width="100%"
              height="100%"
              className="min-h-[600px]"
            >
              <p>Unable to display file. Please download to view.</p>
            </object>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
