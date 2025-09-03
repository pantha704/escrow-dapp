import React from "react";
import type { ErrorState } from "../hooks/useErrorHandler";

interface ErrorDisplayProps {
  error: ErrorState | null;
  onClose: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onClose,
}) => {
  if (!error) return null;

  const bgColor = {
    error: "bg-red-600/20 border-red-500/50",
    warning: "bg-yellow-600/20 border-yellow-500/50",
    info: "bg-blue-600/20 border-blue-500/50",
  }[error.type];

  const textColor = {
    error: "text-red-300",
    warning: "text-yellow-300",
    info: "text-blue-300",
  }[error.type];

  return (
    <div
      className={`${bgColor} border rounded-lg p-4 mb-4 flex justify-between items-start`}
    >
      <div className="flex-1">
        <p className={`${textColor} text-sm`}>{error.message}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-gray-400 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
};
