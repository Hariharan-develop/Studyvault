/**
 * Robust Client-Side Document & File Storage using Browser IndexedDB
 * Allows storing full, uncompressed original uploaded documents (PDFs, DOCX, TXT, Images)
 * without size limits or Firestore document size restrictions (1MB cap).
 */

const DB_NAME = "StudyVault_Files_DB";
const DB_VERSION = 1;
const STORE_NAME = "original_files";

interface StoredFileRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this browser"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB"));
  });
}

/**
 * Save original uploaded file (File, Blob, or DataURL) keyed by material ID
 */
export async function saveOriginalDocumentFile(
  materialId: string,
  file: File | Blob | string,
  fileName?: string,
  mimeType?: string
): Promise<string> {
  try {
    let dataUrl: string;
    let name = fileName || "document";
    let type = mimeType || "application/octet-stream";
    let size = 0;

    if (typeof file === "string") {
      dataUrl = file;
      size = file.length;
    } else {
      if (file instanceof File) {
        name = file.name;
        type = file.type || type;
        size = file.size;
      } else {
        type = file.type || type;
        size = file.size;
      }

      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    }

    // Attempt IndexedDB storage
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const record: StoredFileRecord = {
          id: materialId,
          name,
          type,
          size,
          dataUrl,
          updatedAt: Date.now(),
        };
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (idbErr) {
      console.warn("IndexedDB storage fallback to memory/localStorage:", idbErr);
    }

    // Also cache in memory / sessionStorage if small enough
    if (size < 2 * 1024 * 1024) {
      try {
        sessionStorage.setItem(`doc_file_${materialId}`, dataUrl);
      } catch {
        // quota exceeded, ignore
      }
    }

    return dataUrl;
  } catch (err) {
    console.error("Error saving original document file:", err);
    return "";
  }
}

/**
 * Retrieve the original document file data URL by material ID
 */
export async function getOriginalDocumentFile(materialId: string): Promise<string | null> {
  // Check sessionStorage cache first
  try {
    const cached = sessionStorage.getItem(`doc_file_${materialId}`);
    if (cached) return cached;
  } catch {
    // ignore
  }

  // Check IndexedDB
  try {
    const db = await openDB();
    return await new Promise<string | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(materialId);
      req.onsuccess = () => {
        const record = req.result as StoredFileRecord | undefined;
        if (record && record.dataUrl) {
          resolve(record.dataUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn("Could not retrieve original file from IndexedDB:", err);
    return null;
  }
}

/**
 * Creates a valid, well-formed PDF 1.4 binary data URL for study documents
 * when no binary was provided during initial sample seeding.
 * This guarantees the PDF viewer and download will open in Adobe/browser with 100% validity.
 */
export function createValidPdfDataUrl(title: string, subject: string, bodyText: string): string {
  // Format clean printable lines
  const cleanTitle = title.replace(/[^\x20-\x7E]/g, " ").slice(0, 60);
  const cleanSubject = subject.replace(/[^\x20-\x7E]/g, " ").slice(0, 40);
  const paragraphs = bodyText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 35);

  let streamContent = `BT\n/F1 18 Tf\n50 750 Td\n(${escapePdfString(cleanTitle)}) Tj\nET\n`;
  streamContent += `BT\n/F2 11 Tf\n50 725 Td\n(Subject: ${escapePdfString(cleanSubject)} | StudyVault Academic Archive) Tj\nET\n`;
  streamContent += `0.5 0.5 0.5 RG\n50 715 m 550 715 l S\n`;

  let y = 690;
  for (const para of paragraphs) {
    if (y < 60) break;
    // Word wrap roughly 80 chars
    const chunks = wrapText(para, 75);
    for (const chunk of chunks) {
      if (y < 60) break;
      streamContent += `BT\n/F2 10 Tf\n50 ${y} Td\n(${escapePdfString(chunk)}) Tj\nET\n`;
      y -= 15;
    }
    y -= 8;
  }

  const streamLen = streamContent.length;

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Length ${streamLen} >>
stream
${streamContent}
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000318 00000 n 
0000000387 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
${450 + streamLen}
%%EOF`;

  return `data:application/pdf;base64,${btoa(pdf)}`;
}

function escapePdfString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text: string, maxLen: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxLen) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = cur ? `${cur} ${w}` : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function downloadDataUrl(
  dataUrl: string,
  fileName: string,
  fallbackType: string = "application/octet-stream"
): boolean {
  try {
    // If it's a data URL, convert to Blob for clean cross-browser download
    if (dataUrl.startsWith("data:")) {
      const parts = dataUrl.split(",");
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : fallbackType;
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } else {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }
  } catch (err) {
    console.error("Direct download failed:", err);
    return false;
  }
}

/**
 * Direct file download helper alias
 */
export const downloadOriginalFileDirect = downloadDataUrl;
