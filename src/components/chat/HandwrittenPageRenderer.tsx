import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  FileText,
  PenTool,
  ZoomIn,
  ZoomOut,
  Maximize2
} from "lucide-react";

interface HandwrittenPageRendererProps {
  content: string;
  subject?: string;
  title?: string;
  sourceCitations?: string[];
  initialInkColor?: "blue" | "black";
}

export const HandwrittenPageRenderer: React.FC<HandwrittenPageRendererProps> = ({
  content,
  subject = "Study Session",
  title = "Handwritten Study Notes",
  sourceCitations = [],
  initialInkColor = "blue",
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [inkColor, setInkColor] = useState<"blue" | "black">(initialInkColor);
  const [copied, setCopied] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Parse text into logical display lines and paginate onto notebook pages
  // Each notebook page holds ~20-22 lines
  const LINES_PER_PAGE = 22;

  const rawLines = content
    .split("\n")
    .map(line => line.trimEnd());

  // Flatten and soft-wrap long lines so they fit on ruled notebook lines (~65-75 chars per line)
  const formattedLines: string[] = [];
  rawLines.forEach(line => {
    if (line.length === 0) {
      formattedLines.push("");
    } else if (line.length <= 70) {
      formattedLines.push(line);
    } else {
      // Wrap words
      const words = line.split(" ");
      let currentLine = "";
      for (const word of words) {
        if ((currentLine + " " + word).trim().length > 68) {
          formattedLines.push(currentLine.trim());
          currentLine = "  " + word; // slight indent for wrapped lines
        } else {
          currentLine = currentLine ? `${currentLine} ${word}` : word;
        }
      }
      if (currentLine.trim()) {
        formattedLines.push(currentLine.trim());
      }
    }
  });

  // Chunk lines into pages
  const pages: string[][] = [];
  for (let i = 0; i < formattedLines.length; i += LINES_PER_PAGE) {
    pages.push(formattedLines.slice(i, i + LINES_PER_PAGE));
  }
  if (pages.length === 0) pages.push(["(No content to display)"]);

  const totalPages = pages.length;
  const activeLines = pages[currentPage - 1] || [];

  // Ink color styles
  const inkClass =
    inkColor === "blue"
      ? "text-[#1E3A8A]" // Deep Royal Blue Pen Ink
      : "text-[#0F172A]"; // Deep Black Gel Pen Ink

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // High-resolution Canvas Render for PNG Download
  const handleDownloadPNG = () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // High-DPI canvas (2x standard resolution for crisp print/export)
      const width = 1200;
      const height = 1600;
      canvas.width = width;
      canvas.height = height;

      // 1. Paper Background (Warm A4/College Ruled texture)
      ctx.fillStyle = "#FDFBF7";
      ctx.fillRect(0, 0, width, height);

      // Subtle paper grain/border
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // 2. Punch holes on left edge
      const holeX = 40;
      ctx.fillStyle = "#E2E8F0";
      [300, 800, 1300].forEach(holeY => {
        ctx.beginPath();
        ctx.arc(holeX, holeY, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#CBD5E1";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // 3. Left Red Margin Line
      const marginX = 140;
      ctx.beginPath();
      ctx.moveTo(marginX, 20);
      ctx.lineTo(marginX, height - 20);
      ctx.strokeStyle = "#F87171"; // Red margin line
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Top Margin Line (Double Red line)
      const topMarginY = 160;
      ctx.beginPath();
      ctx.moveTo(20, topMarginY);
      ctx.lineTo(width - 20, topMarginY);
      ctx.strokeStyle = "#FCA5A5";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 4. Horizontal Ruled Blue Lines
      const lineSpacing = 58;
      const startY = topMarginY + lineSpacing;
      ctx.strokeStyle = "#D1D5DB";
      ctx.lineWidth = 1;

      for (let y = startY; y < height - 80; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(marginX, y);
        ctx.lineTo(width - 40, y);
        ctx.stroke();
      }

      // 5. Header: Date, Page No, Subject
      ctx.font = "bold 24px 'Caveat', 'Kalam', 'Segoe Print', cursive";
      ctx.fillStyle = inkColor === "blue" ? "#1E3A8A" : "#0F172A";
      ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, marginX + 20, 80);
      ctx.fillText(`Subject: ${subject}`, marginX + 20, 120);
      ctx.fillText(`Page: ${currentPage} / ${totalPages}`, width - 220, 80);

      // 6. Draw Content Lines
      const textX = marginX + 25;
      let textY = startY - 14;

      activeLines.forEach((line) => {
        let drawText = line.trim();
        let isHeading = false;
        let isNumbered = false;

        // Heading detection
        if (drawText.startsWith("#") || drawText.startsWith("**") && drawText.endsWith("**")) {
          isHeading = true;
          drawText = drawText.replace(/^#+\s*/, "").replace(/\*\*/g, "");
        } else if (/^\d+[\.\)]\s/.test(drawText)) {
          isNumbered = true;
        }

        // Font settings
        if (isHeading) {
          ctx.font = "bold 32px 'Caveat', 'Kalam', 'Segoe Print', cursive";
          ctx.fillStyle = inkColor === "blue" ? "#1E40AF" : "#0F172A";
          ctx.fillText(drawText, textX, textY);

          // Underline heading
          const textMetrics = ctx.measureText(drawText);
          ctx.beginPath();
          ctx.moveTo(textX, textY + 6);
          ctx.lineTo(textX + textMetrics.width, textY + 6);
          ctx.strokeStyle = inkColor === "blue" ? "#2563EB" : "#334155";
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.font = "26px 'Caveat', 'Kalam', 'Segoe Print', cursive";
          ctx.fillStyle = inkColor === "blue" ? "#1E3A8A" : "#1E293B";
          ctx.fillText(drawText, isNumbered ? textX - 10 : textX, textY);
        }

        textY += lineSpacing;
      });

      // 7. Footer Citation Stamp
      if (sourceCitations.length > 0) {
        ctx.font = "italic 18px 'Caveat', 'Kalam', 'Segoe Print', cursive";
        ctx.fillStyle = "#64748B";
        ctx.fillText(`Grounded Citations: ${sourceCitations.slice(0, 2).join(" • ")}`, marginX + 25, height - 35);
      }

      // 8. Trigger PNG download
      const imageURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `StudyVault_Handwritten_Page_${currentPage}.png`;
      link.href = imageURL;
      link.click();
    } catch (err) {
      console.error("Failed to render handwritten canvas:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center my-4">
      {/* Top Controls Bar */}
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl px-4 py-2.5 mb-3 flex flex-wrap items-center justify-between shadow-xs gap-2">
        {/* Left: Page Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Center: Ink Selector */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <span className="text-slate-500 text-[11px] px-1">Ink:</span>
          <button
            onClick={() => setInkColor("blue")}
            className={`px-2 py-0.5 rounded flex items-center space-x-1 transition ${
              inkColor === "blue" ? "bg-blue-600 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"></span>
            <span>Blue Ink</span>
          </button>
          <button
            onClick={() => setInkColor("black")}
            className={`px-2 py-0.5 rounded flex items-center space-x-1 transition ${
              inkColor === "black" ? "bg-slate-800 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
            <span>Gel Black</span>
          </button>
        </div>

        {/* Right: Actions (Copy & Download PNG) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
            title="Copy Text Content"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            onClick={handleDownloadPNG}
            disabled={downloading}
            className="flex items-center space-x-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition disabled:opacity-50"
            title="Download this page as high-res PNG image"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{downloading ? "Exporting..." : "Download PNG"}</span>
          </button>
        </div>
      </div>

      {/* Realistic Ruled Notebook Sheet */}
      <div
        className={`w-full max-w-2xl bg-[#FDFBF7] border border-slate-300 rounded-lg shadow-md relative overflow-hidden transition-all duration-200 select-text ${
          isZoomed ? "scale-105" : ""
        }`}
        style={{
          minHeight: "720px",
          fontFamily: "'Caveat', 'Kalam', 'Patrick Hand', cursive",
        }}
      >
        {/* Notebook punch holes on left */}
        <div className="absolute left-2.5 top-20 bottom-20 flex flex-col justify-around pointer-events-none z-10">
          <div className="w-3.5 h-3.5 rounded-full bg-slate-200 border border-slate-300 shadow-inner"></div>
          <div className="w-3.5 h-3.5 rounded-full bg-slate-200 border border-slate-300 shadow-inner"></div>
          <div className="w-3.5 h-3.5 rounded-full bg-slate-200 border border-slate-300 shadow-inner"></div>
        </div>

        {/* Vertical Red Margin Line */}
        <div className="absolute left-14 top-0 bottom-0 w-[2px] bg-red-400 pointer-events-none z-10"></div>

        {/* Notebook Header Strip */}
        <div className="pt-5 pb-3 pl-18 pr-6 border-b border-red-300 bg-amber-50/20 flex items-center justify-between text-base font-bold">
          <div className={inkClass}>
            <span>Date: {new Date().toLocaleDateString()}</span>
            <span className="mx-3">•</span>
            <span>Subject: {subject}</span>
          </div>
          <div className={`text-sm ${inkClass}`}>
            Page {currentPage} / {totalPages}
          </div>
        </div>

        {/* Ruled Notebook Content Container */}
        <div
          className="pl-18 pr-6 pt-3 pb-8 text-xl leading-[38px] tracking-wide"
          style={{
            backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 37px, #E2E8F0 37px, #E2E8F0 38px)",
            backgroundAttachment: "local",
          }}
        >
          {activeLines.map((line, idx) => {
            const trimmed = line.trim();
            const isHeading = trimmed.startsWith("#") || (trimmed.startsWith("**") && trimmed.endsWith("**"));
            const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
            const isNumbered = /^\d+[\.\)]\s/.test(trimmed);

            if (!trimmed) {
              return <div key={idx} className="h-[38px]">&nbsp;</div>;
            }

            if (isHeading) {
              const cleanHeading = trimmed.replace(/^#+\s*/, "").replace(/\*\*/g, "");
              return (
                <div
                  key={idx}
                  className={`h-[38px] font-bold text-2xl tracking-wide inline-block border-b-2 ${
                    inkColor === "blue" ? "text-blue-900 border-blue-500" : "text-slate-950 border-slate-700"
                  }`}
                >
                  {cleanHeading}
                </div>
              );
            }

            return (
              <div
                key={idx}
                className={`h-[38px] overflow-hidden whitespace-nowrap text-ellipsis ${inkClass} ${
                  isNumbered ? "font-semibold" : ""
                }`}
              >
                {trimmed}
              </div>
            );
          })}
        </div>

        {/* Bottom Footer Note / Citations */}
        {sourceCitations.length > 0 && (
          <div className="absolute bottom-2 left-18 right-6 text-xs text-slate-400 truncate italic font-sans">
            Source Grounding: {sourceCitations.join(" | ")}
          </div>
        )}
      </div>

      {/* Hidden Canvas Element for Exports */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
