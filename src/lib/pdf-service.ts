/**
 * PDF.js Service & Utility Layer
 * Enables 100% reliable in-browser PDF rendering directly onto HTML5 <canvas>
 * Bypasses Chrome and sandboxed iframe blocking of data:application/pdf
 */

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

const PDFJS_SCRIPT_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

let loadingPromise: Promise<any> | null = null;

/**
 * Initializes and retrieves the Mozilla PDF.js library instance
 */
export async function getPdfJs(): Promise<any> {
  if (typeof window === "undefined") return null;

  if (window.pdfjsLib) {
    if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
    }
    return window.pdfjsLib;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise<any>((resolve, reject) => {
    // Check if already injected
    const existing = document.querySelector(`script[src="${PDFJS_SCRIPT_SRC}"]`) as HTMLScriptElement;
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
          resolve(window.pdfjsLib);
        } else {
          reject(new Error("pdfjsLib not defined after script load"));
        }
      });
      existing.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.src = PDFJS_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("PDF.js failed to initialize"));
      }
    };
    script.onerror = (err) => {
      loadingPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return loadingPromise;
}

/**
 * Converts a base64 Data URL, Blob, or ArrayBuffer into a Uint8Array
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  try {
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    const binary = atob(base64.replace(/\s/g, ""));
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.error("Failed to convert data URL to Uint8Array:", err);
    throw new Error("Invalid base64 PDF payload");
  }
}

/**
 * Loads a PDF document using PDF.js from a data URL or byte array
 */
export async function loadPdfDocument(source: string | ArrayBuffer | Uint8Array): Promise<any> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) throw new Error("PDF.js library unavailable");

  let data: Uint8Array;
  if (typeof source === "string") {
    data = dataUrlToUint8Array(source);
  } else if (source instanceof ArrayBuffer) {
    data = new Uint8Array(source);
  } else {
    data = source;
  }

  const loadingTask = pdfjs.getDocument({
    data,
    cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
    cMapPacked: true,
  });

  return await loadingTask.promise;
}

/**
 * Extracts plain text from all pages of a PDF document
 */
export async function extractTextFromPdf(source: string | ArrayBuffer | Uint8Array): Promise<string> {
  try {
    const pdfDoc = await loadPdfDocument(source);
    const pagesText: string[] = [];
    const maxPages = Math.min(pdfDoc.numPages, 100);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => item.str || "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (pageStrings) {
        pagesText.push(`[Page ${i}]\n${pageStrings}`);
      }
    }

    return pagesText.join("\n\n");
  } catch (err) {
    console.warn("PDF text extraction warning:", err);
    return "";
  }
}

/**
 * Renders a single PDF page to an HTML5 canvas element with high-DPI crispness
 */
export async function renderPdfPageToCanvas(
  page: any,
  canvas: HTMLCanvasElement,
  scale: number = 1.2
): Promise<void> {
  const dpr = window.devicePixelRatio || 1;
  const viewport = page.getViewport({ scale: scale * dpr });
  const cssViewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${cssViewport.width}px`;
  canvas.style.height = `${cssViewport.height}px`;

  const context = canvas.getContext("2d");
  if (!context) return;

  const renderContext = {
    canvasContext: context,
    viewport,
  };

  await page.render(renderContext).promise;
}
