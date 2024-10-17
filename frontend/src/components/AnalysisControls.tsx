import React from "react";
import { Button } from "@/components/ui/button";

interface AnalysisControlsProps {
  handleAnalyze: () => Promise<void>;
  isLoading: boolean;
}

export function AnalysisControls({
  handleAnalyze,
  isLoading,
}: AnalysisControlsProps) {
  return (
    <div className="space-y-4">
      <Button onClick={handleAnalyze} disabled={isLoading}>
        Analyze
      </Button>
    </div>
  );
}
