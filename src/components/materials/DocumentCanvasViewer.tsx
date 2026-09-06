import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ExternalLink,
  Layers,
  FileText,
  AlertCircle,
  RefreshCw,
  Eye,
  Check
} from "lucide-react";
import { StudyMaterial } from "../../types";
import {
  loadPdfDocument,
  renderPdfPageToCanvas,
} from "../../lib/pdf-service";
import { downloadOriginalFileDirect } from "../../lib/file-storage";

interface DocumentCanvasViewerProps {
  material: StudyMaterial;
  dataUrl: string | null;
  isLoadingDataUrl?: boolean;
  onDownload?: () => void;
}

export const DocumentCanvasViewer: React.FC<DocumentCanvasViewerProps> = ({
  material,
  dataUrl,
  isLoadingDataUrl = false,
  onDownload,
}) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const [viewMode, setViewMode] = useState<"continuous" | "single">("continuous");
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Single page canvas ref
  const singleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const continuousContainerRef = useRef<HTMLDivElement | null>(null);
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);

  const fileType = (material.fileType || "PDF").toUpperCase();
  const isPdf = fileType === "PDF" || (dataUrl && dataUrl.startsWith("data:application/pdf"));
  const isImage = ["PNG", "JPG", "JPEG", "WEBP", "GIF", "SVG"].includes(fileType);
  const isText = ["TXT", "MD", "JSON", "CSV"].includes(fileType);

  // Load PDF document whenever dataUrl changes
  useEffect(() => {
    let isCancelled = false;

    if (!isPdf) {
      setPdfDoc(null);
      setTotalPages(0);
      setLoadError(null);
      return;
    }

    if (!dataUrl) {
      setPdfDoc(null);
      setTotalPages(0);
      return;
    }

    const initPdf = async () => {
      setIsRendering(true);
      setLoadError(null);
      try {
        const doc = await loadPdfDocument(dataUrl);
        if (!isCancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
        }
      } catch (err: any) {
        console.warn("Could not parse PDF using PDF.js:", err);
        if (!isCancelled) {
          setLoadError(err.message || "Failed to render PDF format");
        }
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    };

    initPdf();

    return () => {
      isCancelled = true;
    };
  }, [dataUrl, isPdf]);

  // Render single page when currentPage, scale, or pdfDoc changes
  useEffect(() => {
    if (!pdfDoc || viewMode !== "single" || !singleCanvasRef.current) return;

    let isMounted = true;
    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isMounted && singleCanvasRef.current) {
          await renderPdfPageToCanvas(page, singleCanvasRef.current, scale);
        }
      } catch (err) {
        console.error(`Error rendering page ${currentPage}:`, err);
      }
    };

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [pdfDoc, currentPage, scale, viewMode]);

  // Render continuous pages when viewMode is continuous
  useEffect(() => {
    if (!pdfDoc || viewMode !== "continuous" || !continuousContainerRef.current) return;

    let isMounted = true;
    const container = continuousContainerRef.current;
    container.innerHTML = "";

    const renderAllPages = async () => {
      const numPagesToRender = Math.min(totalPages, 50); // limit to 50 pages for performance

      for (let i = 1; i <= numPagesToRender; i++) {
        if (!isMounted) break;

        const pageWrapper = document.createElement("div");
        pageWrapper.className =
          "flex flex-col items-center mb-6 bg-white rounded-lg shadow-sm border border-slate-200/80 p-2 relative";
        pageWrapper.id = `pdf-page-${i}`;

        const pageBadge = document.createElement("div");
        pageBadge.className =
          "text-[10px] font-mono text-slate-400 mb-1.5 self-start px-2 py-0.5 bg-slate-100 rounded";
        pageBadge.textContent = `Page ${i} of ${totalPages}`;
        pageWrapper.appendChild(pageBadge);

        const canvas = document.createElement("canvas");
        canvas.className = "rounded max-w-full shadow-2xs";
        pageWrapper.appendChild(canvas);

        container.appendChild(pageWrapper);

        try {
          const page = await pdfDoc.getPage(i);
          if (isMounted) {
            await renderPdfPageToCanvas(page, canvas, scale);
          }
        } catch (pageErr) {
          console.warn(`Error rendering page ${i}:`, pageErr);
        }
      }
    };

    renderAllPages();

    return () => {
      isMounted = false;
    };
  }, [pdfDoc, totalPages, scale, viewMode]);

  const handleOpenInNewTab = () => {
    if (!dataUrl) return;
    try {
      if (dataUrl.startsWith("data:")) {
        // Convert to Blob URL for clean browser window display
        const arr = dataUrl.split(",");
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
      } else {
        window.open(dataUrl, "_blank");
      }
    } catch (err) {
      console.error("Open in new tab failed:", err);
      // Fallback
      if (onDownload) onDownload();
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (dataUrl) {
      const fileName = material.fileName || `${material.name}.${material.fileType || "pdf"}`;
      downloadOriginalFileDirect(dataUrl, fileName);
    }
  };

  return (
    <div
      ref={viewerContainerRef}
      className={`flex flex-col bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-inner ${
        isFullScreen ? "fixed inset-0 z-50 rounded-none bg-slate-900" : "h-[540px]"
      }`}
    >
      {/* Top Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none">
        {/* Left: Document Info & View Mode */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">
              {material.fileName || material.name}
            </span>
          </div>

          {isPdf && totalPages > 0 && (
            <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setViewMode("continuous")}
                className={`px-2 py-1 rounded font-medium transition cursor-pointer flex items-center space-x-1 ${
                  viewMode === "continuous"
                    ? "bg-white text-indigo-600 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Continuous vertical scroll of all pages"
              >
                <Layers className="w-3 h-3" />
                <span className="hidden sm:inline">All Pages</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("single")}
                className={`px-2 py-1 rounded font-medium transition cursor-pointer flex items-center space-x-1 ${
                  viewMode === "single"
                    ? "bg-white text-indigo-600 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Single page view"
              >
                <FileText className="w-3 h-3" />
                <span className="hidden sm:inline">Single Page</span>
              </button>
            </div>
          )}
        </div>

        {/* Center: Page Controls (Single Mode) & Zoom */}
        <div className="flex items-center space-x-2">
          {isPdf && viewMode === "single" && totalPages > 0 && (
            <div className="flex items-center space-x-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-0.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-semibold text-slate-800 px-1">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-0.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isPdf && (
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.6, Math.round((s - 0.15) * 100) / 100))}
                className="p-0.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-700 w-10 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(2.5, Math.round((s + 0.15) * 100) / 100))}
                className="p-0.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Actions (Open New Window, Download, Fullscreen) */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer text-xs flex items-center space-x-1"
            title="Open original document in dedicated tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Open in Tab</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
            title="Download original file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download File</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Document Content Canvas Area */}
      <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-start relative">
        {isLoadingDataUrl || isRendering ? (
          <div className="my-auto text-center py-16 space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">Rendering Document Canvas...</p>
              <p className="text-[11px] text-slate-400">Loading original vector layout and pages</p>
            </div>
          </div>
        ) : isPdf && pdfDoc ? (
          /* PDF RENDERING ON CANVAS (Bypasses Chrome iframe restrictions) */
          viewMode === "continuous" ? (
            <div ref={continuousContainerRef} className="w-full flex flex-col items-center" />
          ) : (
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200/90 flex flex-col items-center">
              <div className="text-[11px] font-mono text-slate-400 mb-2 self-start px-2 py-0.5 bg-slate-100 rounded">
                Page {currentPage} of {totalPages}
              </div>
              <canvas ref={singleCanvasRef} className="rounded shadow-2xs max-w-full" />
            </div>
          )
        ) : isImage && dataUrl ? (
          /* IMAGE RENDERER */
          <div className="my-auto p-4 bg-white rounded-xl border border-slate-200 shadow-sm max-w-2xl">
            <img
              src={dataUrl}
              alt={material.name}
              style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
              className="max-h-[460px] mx-auto rounded object-contain transition-transform duration-150"
            />
          </div>
        ) : isText ? (
          /* CODE / TEXT FILE RENDERER */
          <div className="w-full max-w-4xl bg-white rounded-xl border border-slate-200 p-6 shadow-sm font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
            {material.extractedText || "No text available."}
          </div>
        ) : (
          /* ACADEMIC DOCUMENT FORMAT FALLBACK (When binary isn't present or PDF.js had parse warning) */
          <div className="w-full max-w-3xl bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6 my-2">
            {/* Header Banner */}
            <div className="border-b-2 border-indigo-600 pb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                  {material.subject} • {material.type}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  FILE: {material.fileName || material.name}
                </span>
              </div>
              <h1 className="text-xl font-bold font-serif text-slate-900 leading-tight">
                {material.name}
              </h1>
              {material.description && (
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  {material.description}
                </p>
              )}
            </div>

            {loadError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Original binary stream not cached in current browser session</p>
                  <p className="text-[11px] text-amber-700">
                    Displaying full extracted curriculum content below. You can also download or re-attach the file.
                  </p>
                </div>
              </div>
            )}

            {/* Document Body */}
            <div className="font-serif text-xs text-slate-800 leading-relaxed whitespace-pre-wrap space-y-4">
              {material.extractedText || "No document text available."}
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Indexed & Ready for AI Study Chat & Notes</span>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                Download Document (.PDF)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
