import React from "react";
import { AlertCircle, X } from "lucide-react";
import { RefreshIcon } from "./icons/AppIcons";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      id="error-banner"
      className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm"
    >
      <div className="flex items-center space-x-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      <div className="flex items-center space-x-2">
        {onRetry && (
          <button
            id="retry-button"
            onClick={onRetry}
            className="flex items-center space-x-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-200 transition"
          >
            <RefreshIcon size={14} className="text-red-800" />
            <span>Retry</span>
          </button>
        )}
        {onDismiss && (
          <button
            id="dismiss-error-button"
            onClick={onDismiss}
            className="rounded-lg p-1 text-red-600 hover:bg-red-100 hover:text-red-800 transition"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
