import React from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  progress: number;
}

export function LoadingIndicator({ progress }: LoadingIndicatorProps) {
  return (
    <Card className="mb-4">
      <CardContent className="py-3">
        <div className="flex flex-col items-center">
          <div className="flex items-center mb-2">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span className="text-sm font-semibold">Analyzing...</span>
          </div>
          <Progress value={progress} className="w-full h-2 mb-2" />
          <p className="text-xs text-muted-foreground text-center">
            FARB365 AI is processing your documents. This may take a few
            minutes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
