import React from "react";
import { AIProvider } from "../analysis/types";

interface AnalysisControlsProps {
  provider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
}

const AnalysisControls: React.FC<AnalysisControlsProps> = ({
  provider,
  onProviderChange,
}) => {
  return (
    <div className="mb-4">
      <label htmlFor="provider" className="font-semibold mr-2">
        Choose Analysis Engine:
      </label>
      <select
        id="provider"
        value={provider}
        onChange={(e) => onProviderChange(e.target.value as AIProvider)}
        className="border rounded px-2 py-1"
      >
        <option value="anthropic">Standard Analysis</option>
        <option value="openai">Premium Analysis</option>
      </select>
    </div>
  );
};

export default AnalysisControls;
