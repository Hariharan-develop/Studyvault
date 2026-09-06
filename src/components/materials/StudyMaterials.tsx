import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Eye,
  Bot,
  BrainCircuit,
  BookOpen,
  Sparkles,
  HelpCircle,
  X,
  RefreshCw,
  ChevronRight,
  CloudUpload,
  MoreVertical,
  ChevronDown,
  Info,
  ExternalLink,
  ChevronLeft,
  Download,
  FileDown
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSubjects } from "../../context/SubjectContext";
import { SubjectSelector } from "../common/SubjectSelector";
import { StudyMaterial, StudyMaterialType, ActiveTab, MaterialChunk } from "../../types";
import {
  saveUserStudyMaterial,
  fetchUserStudyMaterials,
  deleteUserStudyMaterial,
  getUserFriendlyErrorMessage
} from "../../lib/firestore-helpers";
import {
  saveOriginalDocumentFile,
  getOriginalDocumentFile,
  downloadOriginalFileDirect,
  createValidPdfDataUrl
} from "../../lib/file-storage";
import { processStudyMaterial } from "../../lib/api";
import { ErrorBanner } from "../ErrorBanner";
import { DocumentCanvasViewer } from "./DocumentCanvasViewer";
import { extractTextFromPdf } from "../../lib/pdf-service";

interface StudyMaterialsProps {
  onNavigate?: (tab: ActiveTab, preselectedMaterial?: StudyMaterial) => void;
}

// Initial sample data matching the exact 5 items in the reference screenshot
const INITIAL_SAMPLE_MATERIALS: StudyMaterial[] = [
  {
    id: "mat_sample_1",
    userId: "guest",
    name: "Operating Systems Syllabus",
    subject: "Operating Systems",
    type: "Syllabus",
    description: "Course syllabus covering CPU Scheduling, Process Synchronization, Memory Management, and Storage Systems.",
    fileName: "Operating_Systems_Syllabus.pdf",
    fileType: "PDF",
    fileSize: 184320,
    processingStatus: "ready",
    chunkCount: 4,
    createdAt: new Date("2026-09-02T10:30:00").getTime(),
    updatedAt: new Date("2026-09-02T10:30:00").getTime(),
    extractedText: `OPERATING SYSTEMS COURSE SYLLABUS
Academic Year 2026-2027

Unit 1: Introduction to Operating Systems & Processes
- Definition, goals, and functions of Operating Systems
- Process Concept: Process Control Block (PCB), Process States, Context Switching
- Inter-Process Communication (IPC): Shared Memory, Message Passing

Unit 2: CPU Scheduling & Synchronization
- Scheduling Criteria: CPU utilization, Throughput, Turnaround time, Waiting time, Response time
- Algorithms: First-Come First-Served (FCFS), Shortest Job First (SJF), Priority Scheduling, Round Robin (RR), Multi-Level Feedback Queue
- Critical Section Problem, Peterson's Solution, Mutex Locks, Semaphores, Classic Synchronization Problems (Dining Philosophers, Producer-Consumer)

Unit 3: Deadlocks & Memory Management
- Deadlock Characterization: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait
- Deadlock Prevention, Avoidance (Banker's Algorithm), Detection and Recovery
- Main Memory: Contiguous Memory Allocation, Paging, Segmentation
- Virtual Memory: Demand Paging, Page Replacement Algorithms (FIFO, LRU, Optimal)

Unit 4: Storage & File Systems
- Mass Storage Structure: Disk Scheduling (FCFS, SSTF, SCAN, C-SCAN)
- File Concept, Access Methods, Directory Structure, File System Mounting, Protection`
  },
  {
    id: "mat_sample_2",
    userId: "guest",
    name: "Unit 1 Handwritten Notes",
    subject: "Operating Systems",
    type: "Class Notes",
    description: "Detailed classroom lecture notes covering process lifecycle, state diagrams, PCB contents, and context switching.",
    fileName: "Unit_1_Handwritten_Notes.pdf",
    fileType: "PDF",
    fileSize: 4194304,
    processingStatus: "ready",
    chunkCount: 8,
    createdAt: new Date("2026-09-01T14:15:00").getTime(),
    updatedAt: new Date("2026-09-01T14:15:00").getTime(),
    extractedText: `CLASS NOTES: PROCESS MANAGEMENT & THREADS
Date: September 1, 2026 | Prof. Richardson

1. What is a Process?
A process is a program in execution. It consists of:
- Text section: Program code
- Program counter: Current instruction pointer
- Stack: Temporary data (function params, return addresses, local variables)
- Data section: Global variables
- Heap: Dynamically allocated memory during runtime

2. Process States:
- NEW: The process is being created.
- READY: The process is waiting to be assigned to a processor.
- RUNNING: Instructions are being executed.
- WAITING (BLOCKED): Waiting for some event to occur (such as I/O completion).
- TERMINATED: The process has finished execution.

3. Process Control Block (PCB):
Also known as Task Control Block. Contains:
- Process State
- Process Number (PID)
- Program Counter
- CPU Registers (Accumulators, index registers, stack pointers)
- CPU Scheduling Information (Priority, pointers to scheduling queues)
- Memory-management information (Page tables or segment tables)
- Accounting information (CPU time used, clock time)
- I/O status information (List of I/O devices allocated to the process)`
  },
  {
    id: "mat_sample_3",
    userId: "guest",
    name: "Process Scheduling Diagrams",
    subject: "Operating Systems",
    type: "Teacher Notes",
    description: "High-resolution diagrams showing state transitions, Gantt charts, and scheduling algorithm comparisons.",
    fileName: "Process_Scheduling_Diagrams.jpg",
    fileType: "JPG",
    fileSize: 1258291,
    processingStatus: "ready",
    chunkCount: 3,
    createdAt: new Date("2026-08-28T09:00:00").getTime(),
    updatedAt: new Date("2026-08-28T09:00:00").getTime(),
    extractedText: `PROCESS SCHEDULING DIAGRAMS & GANTT CHARTS
Reference Architecture: Uniprocessor System

Diagram 1: Five-State Process Transition Model
[New] -> (admitted) -> [Ready] <-> (scheduler dispatch / interrupt) <-> [Running] -> (exit) -> [Terminated]
                          ^                                                 |
                          |---------- (I/O or event completion) <--- [Waiting]

Diagram 2: Round Robin Gantt Chart Example (Time Quantum = 4ms)
Processes: P1 (Burst: 24), P2 (Burst: 3), P3 (Burst: 3)
Schedule: [P1: 0-4] -> [P2: 4-7] -> [P3: 7-10] -> [P1: 10-14] -> [P1: 14-18] -> [P1: 18-22] -> [P1: 22-26] -> [P1: 26-30]
Average Waiting Time: ((10-4) + 4 + 7) / 3 = 5.66ms`
  },
  {
    id: "mat_sample_4",
    userId: "guest",
    name: "Previous Year Questions",
    subject: "Operating Systems",
    type: "Question Bank",
    description: "Past 5 years university examination questions on Banker's Algorithm, Semaphores, and Virtual Memory paging.",
    fileName: "Previous_Year_Questions.pdf",
    fileType: "PDF",
    fileSize: 838860,
    processingStatus: "processing",
    chunkCount: 2,
    createdAt: new Date("2026-08-20T16:45:00").getTime(),
    updatedAt: new Date("2026-08-20T16:45:00").getTime(),
    extractedText: `EXAMINATION QUESTION ARCHIVE (2021-2025)
Subject: Operating Systems | Total Marks: 100

1. (a) Distinguish between preemptive and non-preemptive CPU scheduling. (5 Marks)
   (b) Consider 5 processes with burst times: P1: 10ms, P2: 29ms, P3: 3ms, P4: 7ms, P5: 12ms.
       Compute average waiting time for FCFS and SJF. (10 Marks)

2. (a) State the four necessary conditions for deadlock occurrence. (4 Marks)
   (b) Explain Banker's Algorithm for deadlock avoidance with safety algorithm proof. (11 Marks)

3. (a) Explain the concept of Belady's Anomaly in FIFO page replacement with an example. (8 Marks)
   (b) How does LRU page replacement address the anomaly? Discuss hardware implementation using counters and stack. (7 Marks)`
  },
  {
    id: "mat_sample_5",
    userId: "guest",
    name: "Textbook (Selected Chapters)",
    subject: "Operating Systems",
    type: "Textbook / Reference",
    description: "Silberschatz, Galvin & Gagne - Operating System Concepts 10th Edition: Chapters 3, 5, 7, and 9.",
    fileName: "Textbook_Selected_Chapters.pdf",
    fileType: "PDF",
    fileSize: 15728640,
    processingStatus: "ready",
    chunkCount: 24,
    createdAt: new Date("2026-08-15T11:20:00").getTime(),
    updatedAt: new Date("2026-08-15T11:20:00").getTime(),
    extractedText: `OPERATING SYSTEM CONCEPTS (10th Edition)
Authors: Silberschatz, Galvin, Gagne
Selected Chapters: Chapter 3 (Processes), Chapter 5 (CPU Scheduling), Chapter 7 (Deadlocks), Chapter 9 (Virtual Memory)

Chapter 5: CPU Scheduling Summary
CPU scheduling is the basis of multiprogrammed operating systems. By switching the CPU among processes, the operating system can make the computer more productive. In a system with a single processor, only one process can run at any given time. Others must wait until the CPU is free and can be rescheduled.

Chapter 7: Deadlocks Summary
A deadlock is a situation where a set of processes are blocked because each process is holding a resource and waiting for another resource acquired by some other process.
To prevent deadlocks, we can invalidate one of the four necessary conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.`
  }
];

export const StudyMaterials: React.FC<StudyMaterialsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Sub-tabs: "my_materials" | "upload"
  const [activeSubTab, setActiveSubTab] = useState<"my_materials" | "upload">("my_materials");

  // Selection & Viewer State for Sidebar and Preview
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [previewFormatTab, setPreviewFormatTab] = useState<"original" | "chunks">("original");
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);

  // Upload form state (Modal / Panel)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState<string>("");
  const [uploadSubject, setUploadSubject] = useState<string>("");
  const [customSubject, setCustomSubject] = useState<string>("");
  const [uploadType, setUploadType] = useState<string>("");
  const [uploadDescription, setUploadDescription] = useState<string>("");
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const directFileInputRef = useRef<HTMLInputElement | null>(null);

  // Search & Filter (Right Card)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterPill, setFilterPill] = useState<string>("All");

  // Modals & Menu State
  const [previewMaterial, setPreviewMaterial] = useState<StudyMaterial | null>(null);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [isLoadingPreviewDoc, setIsLoadingPreviewDoc] = useState<boolean>(false);
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top?: number; bottom?: number; right?: number } | null>(null);
  const [actionMenuMaterial, setActionMenuMaterial] = useState<StudyMaterial | null>(null);

  // Close action menu overlay on scroll or window resize
  useEffect(() => {
    if (!actionMenuOpenId) return;
    const handleCloseMenu = () => {
      setActionMenuOpenId(null);
      setActionMenuPosition(null);
      setActionMenuMaterial(null);
    };
    window.addEventListener("scroll", handleCloseMenu, true);
    window.addEventListener("resize", handleCloseMenu);
    return () => {
      window.removeEventListener("scroll", handleCloseMenu, true);
      window.removeEventListener("resize", handleCloseMenu);
    };
  }, [actionMenuOpenId]);

  const { subjects, addSubject } = useSubjects();

  const materialTypeOptions = [
    { label: "Syllabus", value: "Syllabus" },
    { label: "Class Notes", value: "Class Notes" },
    { label: "Teacher Notes", value: "Teacher Notes" },
    { label: "Question Bank", value: "Question Bank" },
    { label: "Reference", value: "Textbook / Reference" },
    { label: "Other", value: "Other" }
  ];

  const filterPills = [
    { label: "All", value: "All" },
    { label: "Syllabus", value: "Syllabus" },
    { label: "Notes", value: "Notes" },
    { label: "Question Banks", value: "Question Banks" },
    { label: "References", value: "References" },
    { label: "Other", value: "Other" }
  ];

  useEffect(() => {
    loadMaterials();
  }, [user]);

  // Load preview doc binary whenever previewMaterial changes
  useEffect(() => {
    if (!previewMaterial) {
      setPreviewDocUrl(null);
      return;
    }
    let isMounted = true;
    setIsLoadingPreviewDoc(true);

    const loadDocData = async () => {
      try {
        if (previewMaterial.fileDataUrl) {
          if (isMounted) setPreviewDocUrl(previewMaterial.fileDataUrl);
          return;
        }
        const fileData = await getOriginalDocumentFile(previewMaterial.id);
        if (fileData && isMounted) {
          setPreviewDocUrl(fileData);
          return;
        }
        const ext = (previewMaterial.fileType || "pdf").toLowerCase();
        if (ext === "pdf") {
          const generated = createValidPdfDataUrl(
            previewMaterial.name,
            previewMaterial.subject,
            previewMaterial.extractedText || previewMaterial.description || ""
          );
          if (isMounted) setPreviewDocUrl(generated);
        }
      } catch (err) {
        console.warn("Could not load document preview binary:", err);
      } finally {
        if (isMounted) setIsLoadingPreviewDoc(false);
      }
    };

    loadDocData();
    return () => {
      isMounted = false;
    };
  }, [previewMaterial]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      if (user) {
        const items = await fetchUserStudyMaterials(user.uid);
        if (items && items.length > 0) {
          setMaterials(items);
          setSelectedMaterial((prev) => prev || items[0]);
        } else {
          // If no items in database yet, display the 5 realistic items
          setMaterials(INITIAL_SAMPLE_MATERIALS);
          setSelectedMaterial((prev) => prev || INITIAL_SAMPLE_MATERIALS[0]);
        }
      } else {
        setMaterials(INITIAL_SAMPLE_MATERIALS);
        setSelectedMaterial((prev) => prev || INITIAL_SAMPLE_MATERIALS[0]);
      }
    } catch (err: any) {
      console.error("Failed to load study materials:", err);
      // Fallback gracefully to sample materials
      setMaterials(INITIAL_SAMPLE_MATERIALS);
      setSelectedMaterial((prev) => prev || INITIAL_SAMPLE_MATERIALS[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMaterial = async (mat: StudyMaterial) => {
    try {
      let dataUrl = mat.fileDataUrl || (await getOriginalDocumentFile(mat.id));
      const ext = (mat.fileType || "pdf").toLowerCase();
      const sanitizedName = (mat.fileName || `${mat.name}.${ext}`).replace(/[^a-zA-Z0-9._-]/g, "_");

      if (dataUrl) {
        downloadOriginalFileDirect(dataUrl, sanitizedName);
        setSuccessMessage(`Downloaded original format document: "${sanitizedName}"`);
        setTimeout(() => setSuccessMessage(""), 4000);
        return;
      }

      if (ext === "pdf") {
        const validPdfUrl = createValidPdfDataUrl(
          mat.name,
          mat.subject,
          mat.extractedText || mat.description || ""
        );
        downloadOriginalFileDirect(validPdfUrl, sanitizedName, "application/pdf");
      } else {
        const content = mat.extractedText || `STUDY MATERIAL: ${mat.name}\nSubject: ${mat.subject}\nType: ${mat.type}\n\n${mat.description || ""}`;
        const mimeType = ext === "md" ? "text/markdown" : "text/plain";
        const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = sanitizedName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }

      setSuccessMessage(`Downloaded original format document: "${sanitizedName}"`);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error("Download error:", err);
      setErrorMessage("Could not download file.");
    }
  };

  const handleFileChange = (file: File) => {
    setFileToUpload(file);
    if (!uploadName.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setUploadName(baseName);
    }
    if (!uploadSubject && subjects.length > 0) {
      setUploadSubject(subjects[0]);
    }
    if (!uploadType) {
      setUploadType("Class Notes");
    }
  };

  const handleResetForm = () => {
    setFileToUpload(null);
    setUploadName("");
    setUploadSubject("");
    setCustomSubject("");
    setUploadType("");
    setUploadDescription("");
    if (directFileInputRef.current) {
      directFileInputRef.current.value = "";
    }
  };

  const handleUploadSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!uploadName.trim()) {
      setErrorMessage("Please enter a Material Name.");
      return;
    }

    const finalSubject =
      uploadSubject === "+ Custom Subject" || uploadSubject === "__ADD_CUSTOM__"
        ? customSubject.trim() || "General"
        : uploadSubject.trim() || (subjects.length > 0 ? subjects[0] : "General");

    const finalType: StudyMaterialType =
      (uploadType as StudyMaterialType) || "Class Notes";

    setIsProcessingUpload(true);
    setErrorMessage("");

    try {
      const materialId = `mat_${Date.now()}`;
      const fileName = fileToUpload ? fileToUpload.name : `${uploadName.trim()}.pdf`;
      const fileExt = fileToUpload ? fileName.split(".").pop()?.toUpperCase() || "PDF" : "PDF";
      const fileSize = fileToUpload ? fileToUpload.size : 1024 * 256;

      let extractedText = `STUDY MATERIAL: ${uploadName.trim()}
Subject: ${finalSubject}
Type: ${finalType}
Description: ${uploadDescription || "Full study document content"}

This study document contains complete curriculum notes and references for ${finalSubject}. Stored in your library for AI grounding.`;

      let fileDataUrl: string | undefined = undefined;

      if (fileToUpload) {
        try {
          fileDataUrl = await saveOriginalDocumentFile(materialId, fileToUpload, fileName, fileToUpload.type);
        } catch (storageErr) {
          console.warn("Could not save to IndexedDB:", storageErr);
        }

        const lowerExt = fileExt.toLowerCase();
        if (lowerExt === "txt" || lowerExt === "md") {
          try {
            extractedText = await fileToUpload.text();
          } catch {
            // Keep default extractedText
          }
        } else if (lowerExt === "pdf" && fileDataUrl) {
          try {
            const parsedText = await extractTextFromPdf(fileDataUrl);
            if (parsedText && parsedText.trim().length > 30) {
              extractedText = parsedText;
            }
          } catch (pdfErr) {
            console.warn("Could not extract text from PDF:", pdfErr);
          }
        }
      }

      // Automatically store custom subject globally across all pages
      if (finalSubject && finalSubject !== "General") {
        try {
          await addSubject(finalSubject);
        } catch (subjErr) {
          console.warn("Could not sync subject:", subjErr);
        }
      }

      const newMaterial: StudyMaterial = {
        id: materialId,
        userId: user ? user.uid : "guest",
        name: uploadName.trim(),
        subject: finalSubject,
        type: finalType,
        description: uploadDescription.trim(),
        fileName,
        fileType: fileExt,
        fileSize,
        processingStatus: "ready",
        chunkCount: Math.ceil(extractedText.length / 1000) || 1,
        extractedText,
        fileDataUrl: fileDataUrl && fileDataUrl.length < 400000 ? fileDataUrl : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Save to Firestore if authenticated
      let savedMaterial = newMaterial;
      if (user) {
        try {
          savedMaterial = await saveUserStudyMaterial(user.uid, newMaterial);
        } catch (saveErr) {
          console.warn("Firestore save warning, using local state:", saveErr);
        }
      }

      setMaterials((prev) => [savedMaterial, ...prev.filter((m) => m.id !== savedMaterial.id)]);
      setSuccessMessage(`Full study material "${savedMaterial.name}" successfully uploaded and saved to your library!`);
      setTimeout(() => setSuccessMessage(""), 6000);

      handleResetForm();
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Failed to upload study material."));
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleDelete = async (matId: string, name: string) => {
    setActionMenuOpenId(null);
    if (!window.confirm(`Are you sure you want to delete "${name}" from your study materials?`)) {
      return;
    }
    try {
      if (user) {
        await deleteUserStudyMaterial(user.uid, matId);
      }
      setMaterials((prev) => prev.filter((m) => m.id !== matId));
      setSuccessMessage(`Deleted "${name}"`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Failed to delete material:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Failed to delete study material."));
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "Recent";
    const date = typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    if (isNaN(date.getTime())) return "Recent";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Helper to render the red PP / blue doc / purple chart / green Be icon
  const renderMaterialIcon = (mat: StudyMaterial) => {
    const fileType = (mat.fileType || "").toUpperCase();
    const type = (mat.type || "").toLowerCase();
    const name = (mat.name || "").toLowerCase();

    // Red PP Icon (PowerPoint / Syllabus / Questions)
    if (type.includes("syllabus") || type.includes("question") || name.includes("syllabus") || name.includes("question")) {
      return (
        <div className="w-6 h-6 rounded bg-[#E03E3E] text-white flex items-center justify-center font-bold text-[9px] tracking-tight shrink-0 shadow-2xs">
          PP
        </div>
      );
    }

    // Green "Be" or Book Icon (Reference / Textbook)
    if (type.includes("reference") || type.includes("textbook") || name.includes("textbook")) {
      return (
        <div className="w-6 h-6 rounded bg-[#00A862] text-white flex items-center justify-center font-bold text-[9px] tracking-tight shrink-0 shadow-2xs">
          Be
        </div>
      );
    }

    // Purple diagram / chart icon (Images / Diagrams)
    if (fileType === "JPG" || fileType === "PNG" || fileType === "JPEG" || name.includes("diagram") || type.includes("teacher")) {
      return (
        <div className="w-6 h-6 rounded bg-[#8A3FFC] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
      );
    }

    // Blue Document icon (Notes / General PDF)
    return (
      <div className="w-6 h-6 rounded bg-[#0F62FE] text-white flex items-center justify-center shrink-0 shadow-2xs">
        <FileText className="w-3.5 h-3.5 text-white" />
      </div>
    );
  };

  // Helper to render type pills
  const renderTypePill = (type: string) => {
    switch (type) {
      case "Syllabus":
        return <span className="bg-[#E0F2FE] text-[#0369A1] font-semibold text-[10px] px-2 py-0.5 rounded">Syllabus</span>;
      case "Class Notes":
        return <span className="bg-[#DCFCE7] text-[#15803D] font-semibold text-[10px] px-2 py-0.5 rounded">Class Notes</span>;
      case "Teacher Notes":
        return <span className="bg-[#F3E8FF] text-[#7E22CE] font-semibold text-[10px] px-2 py-0.5 rounded">Teacher Notes</span>;
      case "Question Bank":
        return <span className="bg-[#FFE4E6] text-[#BE123C] font-semibold text-[10px] px-2 py-0.5 rounded">Question Bank</span>;
      case "Textbook / Reference":
      case "Reference":
        return <span className="bg-[#FEF3C7] text-[#B45309] font-semibold text-[10px] px-2 py-0.5 rounded">Reference</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 font-semibold text-[10px] px-2 py-0.5 rounded">{type}</span>;
    }
  };

  // Filter materials based on search and selected pill
  const filteredMaterials = materials.filter((mat) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = mat.name.toLowerCase().includes(q);
      const matchSubj = mat.subject.toLowerCase().includes(q);
      const matchType = mat.type.toLowerCase().includes(q);
      const matchFile = (mat.fileType || "").toLowerCase().includes(q);
      if (!matchName && !matchSubj && !matchType && !matchFile) {
        return false;
      }
    }

    // Pill filter
    if (filterPill === "All") return true;
    if (filterPill === "Syllabus") return mat.type === "Syllabus";
    if (filterPill === "Notes") return mat.type === "Class Notes" || mat.type === "Teacher Notes";
    if (filterPill === "Question Banks") return mat.type === "Question Bank";
    if (filterPill === "References") return mat.type === "Textbook / Reference";
    if (filterPill === "Other") return mat.type === "Other" || mat.type === "Lecture Slides";
    return true;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner / Alerts */}
      {errorMessage && (
        <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage("")} />
      )}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage("")} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* PAGE HEADER: Matching screenshot exactly */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          {/* Violet square icon with folded document */}
          <div className="w-12 h-12 rounded-2xl bg-[#6366F1] text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Study Materials
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed break-words [overflow-wrap:anywhere] whitespace-normal">
              Upload and organize the learning resources StudyVault AI can use in AI Chat, Smart Notes, and Study Planner.
            </p>
          </div>
        </div>

        {/* Right Help Card: "Need help? Learn how to use study materials >" */}
        <div
          id="help-card-btn"
          onClick={() => setHelpModalOpen(true)}
          className="bg-white border border-slate-200/90 hover:border-indigo-300 rounded-xl px-4 py-2.5 flex items-center space-x-3 cursor-pointer transition shadow-2xs group shrink-0"
        >
          <div className="text-indigo-600 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-600 block leading-tight">Need help?</span>
            <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">Learn how to use study materials</span>
          </div>
          <ChevronRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* SUB-HEADER BAR: My Materials Library & Upload Material Action */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-900 text-sm">Study Materials Library</span>
          <span className="bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full text-[11px] border border-indigo-100">
            {materials.length} {materials.length === 1 ? "document" : "documents"}
          </span>
        </div>
        <button
          id="btn-open-upload-modal"
          onClick={() => setUploadModalOpen(true)}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-white" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* TWO-COLUMN MAIN LAYOUT: Matching screenshot side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Study Material Sidebar (View as Original Uploaded Format & Download) (lg:col-span-5) */}
        <div
          id="study-material-sidebar-viewer"
          className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-snug">Original Format Viewer</h2>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Preview in authentic uploaded structure
                </p>
              </div>
            </div>

            {selectedMaterial && (
              <button
                onClick={() => handleDownloadMaterial(selectedMaterial)}
                className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-100 transition cursor-pointer"
                title="Download original document"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>

          {selectedMaterial ? (
            <div className="space-y-4">
              {/* Document Title & Badges with word wrapping if overflow */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <div className="flex items-start space-x-2.5">
                  <div className="shrink-0 mt-0.5">
                    {renderMaterialIcon(selectedMaterial)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="font-bold text-slate-900 text-xs break-words [overflow-wrap:anywhere] whitespace-normal leading-snug"
                      title={selectedMaterial.name}
                    >
                      {selectedMaterial.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono break-words [overflow-wrap:anywhere] whitespace-normal mt-0.5">
                      {selectedMaterial.fileName || selectedMaterial.name}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                  <span className="px-2 py-0.5 bg-indigo-100/80 text-indigo-800 font-bold rounded-md uppercase tracking-wider shrink-0">
                    {selectedMaterial.fileType || "PDF"}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200/80 text-slate-700 font-medium rounded-md break-words [overflow-wrap:anywhere] whitespace-normal">
                    {selectedMaterial.subject}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100/80 text-emerald-800 font-medium rounded-md shrink-0">
                    {selectedMaterial.type}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100/80 text-amber-800 font-medium rounded-md shrink-0">
                    {selectedMaterial.chunkCount || 1} chunks
                  </span>
                </div>
              </div>

              {/* Document Canvas (Original Uploaded Format) */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 px-1">
                  <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                    Document Canvas
                  </span>
                  <span>~{Math.max(Math.round(((selectedMaterial.extractedText || "").length * 1.5) / 1024), 1)} KB</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-[300px] overflow-y-auto space-y-2 shadow-inner">
                  <div className="pb-2 border-b border-slate-200/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span>FORMAT: {(selectedMaterial.fileType || "PDF").toUpperCase()}</span>
                    <span>READY FOR AI GROUNDING</span>
                  </div>
                  <div className="font-serif text-xs text-slate-800 leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
                    {selectedMaterial.extractedText || "No document preview available."}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Download and View */}
              <div className="space-y-2 pt-1">
                <button
                  id="btn-sidebar-download-material"
                  onClick={() => handleDownloadMaterial(selectedMaterial)}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Download Original ({selectedMaterial.fileType || "PDF"})</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPreviewMaterial(selectedMaterial)}
                    className="py-2 px-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center space-x-1 transition cursor-pointer"
                    title="Open full view modal"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Expand</span>
                  </button>

                  {onNavigate && (
                    <button
                      onClick={() => onNavigate("chat", selectedMaterial)}
                      className="py-2 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-semibold text-xs flex items-center justify-center space-x-1 transition cursor-pointer"
                      title="Ground AI Chat in this document"
                    >
                      <Bot className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Ask AI</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>Select any material in the table to inspect its original uploaded format and download it.</p>
            </div>
          )}

          {/* Quick upload trigger prompt */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Need to add another document?</span>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
            >
              + Upload File
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: My Study Materials Table Card (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div
            id="my-study-materials-card"
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between"
          >
            {/* Header: Title, Subtitle, and Search Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-snug">My Study Materials</h2>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Manage your uploaded materials. Use them in AI Chat, Smart Notes, or Study Planner.
                  </p>
                </div>
              </div>

              {/* Search Box on top right */}
              <div className="relative w-full sm:w-56 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your materials..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Filter Pills: All, Syllabus, Notes, Question Banks, References, Other */}
            <div className="flex items-center space-x-2 py-3 overflow-x-auto no-scrollbar">
              {filterPills.map((pill) => {
                const isActive = filterPill === pill.value;
                return (
                  <button
                    key={pill.value}
                    onClick={() => setFilterPill(pill.value)}
                    className={`px-3.5 py-1 rounded-full text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-[#6366F1] text-white shadow-2xs font-semibold"
                        : "bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
              <div className="pl-1">
                <button
                  type="button"
                  className="w-6 h-6 rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                  title="Scroll filters"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Materials Table */}
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="border-y border-slate-100 text-[11px] font-semibold text-slate-500 bg-slate-50/50">
                    <th className="py-2.5 px-3 font-semibold min-w-[180px] max-w-[280px]">Name</th>
                    <th className="py-2.5 px-3 font-semibold min-w-[110px] max-w-[180px]">Subject</th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Type</th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">File Type</th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Upload Date</th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No study materials matching your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((mat) => {
                      const isReady = mat.processingStatus === "ready";
                      const isProcessing = mat.processingStatus === "processing";

                      return (
                        <tr
                          key={mat.id}
                          onClick={() => setSelectedMaterial(mat)}
                          className={`hover:bg-slate-50/80 transition group text-slate-800 cursor-pointer ${
                            selectedMaterial?.id === mat.id ? "bg-indigo-50/40" : ""
                          }`}
                        >
                          {/* Name + Icon (Wrapped if overflow) */}
                          <td className="py-3 px-3 min-w-[180px] max-w-[280px]">
                            <div className="flex items-start space-x-2.5 min-w-0">
                              <div className="shrink-0 mt-0.5">{renderMaterialIcon(mat)}</div>
                              <span
                                className="font-bold text-slate-900 text-xs break-words [overflow-wrap:anywhere] whitespace-normal leading-snug group-hover:text-indigo-600 transition flex-1 min-w-0"
                                title={mat.name}
                              >
                                {mat.name}
                              </span>
                            </div>
                          </td>

                          {/* Subject (Wrapped if overflow) */}
                          <td className="py-3 px-3 text-slate-600 text-xs break-words [overflow-wrap:anywhere] whitespace-normal min-w-[110px] max-w-[180px]">
                            {mat.subject}
                          </td>

                          {/* Type */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {renderTypePill(mat.type)}
                          </td>

                          {/* File Type */}
                          <td className="py-3 px-3 text-slate-500 text-[11px] font-medium uppercase whitespace-nowrap">
                            {mat.fileType || "PDF"}
                          </td>

                          {/* Upload Date */}
                          <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                            {formatDate(mat.createdAt)}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {isReady && (
                              <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center space-x-1.5 border border-emerald-200/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Ready</span>
                              </span>
                            )}
                            {isProcessing && (
                              <span className="bg-amber-50 text-amber-700 text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center space-x-1.5 border border-amber-200/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                <span>Processing</span>
                              </span>
                            )}
                            {mat.processingStatus === "failed" && (
                              <span className="bg-rose-50 text-rose-700 text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center space-x-1.5 border border-rose-200/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                <span>Failed</span>
                              </span>
                            )}
                          </td>

                          {/* Actions: "⋮" More Actions Menu */}
                          <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center space-x-1 justify-end">
                              <button
                                id={`material-actions-btn-${mat.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (actionMenuOpenId === mat.id) {
                                    setActionMenuOpenId(null);
                                    setActionMenuPosition(null);
                                    setActionMenuMaterial(null);
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const spaceBelow = window.innerHeight - rect.bottom;
                                    const openUpward = spaceBelow < 250;
                                    setActionMenuPosition({
                                      top: openUpward ? undefined : rect.bottom + 6,
                                      bottom: openUpward ? window.innerHeight - rect.top + 6 : undefined,
                                      right: Math.max(16, window.innerWidth - rect.right),
                                    });
                                    setActionMenuOpenId(mat.id);
                                    setActionMenuMaterial(mat);
                                  }
                                }}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  actionMenuOpenId === mat.id
                                    ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                }`}
                                title="Actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer: "Showing X materials" & Pagination "<" "1" ">" */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>Showing {filteredMaterials.length} materials</span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  disabled
                  className="w-7 h-7 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center cursor-not-allowed bg-slate-50/50"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg bg-[#6366F1] text-white font-bold text-xs flex items-center justify-center shadow-2xs"
                >
                  1
                </button>
                <button
                  type="button"
                  disabled
                  className="w-7 h-7 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center cursor-not-allowed bg-slate-50/50"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM INFO CARD: "After uploading" (matching screenshot) */}
          <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-2xl p-4 flex items-start space-x-3.5 shadow-2xs">
            {/* Blue Info Circle Icon */}
            <div className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <span className="font-bold text-[11px] italic">i</span>
            </div>
            <div className="text-xs text-slate-700">
              <h4 className="font-bold text-slate-900 text-xs mb-1">After uploading</h4>
              <ul className="space-y-1 text-[11px] text-slate-600 list-disc pl-4 leading-relaxed">
                <li>Your material will be processed and indexed automatically.</li>
                <li>Once the status shows “Ready”, you can use it in AI Study Chat, Smart Notes, or Study Planner.</li>
                <li>Uploading a material only stores it. It does not synthesize or generate notes automatically.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* GLOBAL FIXED OVERLAY ACTION MENU (Never clipped by table overflow) */}
      {actionMenuOpenId && actionMenuMaterial && actionMenuPosition && (
        <>
          <div
            className="fixed inset-0 z-50 bg-transparent"
            onClick={() => {
              setActionMenuOpenId(null);
              setActionMenuPosition(null);
              setActionMenuMaterial(null);
            }}
          />
          <div
            style={{
              position: "fixed",
              top: actionMenuPosition.top !== undefined ? `${actionMenuPosition.top}px` : undefined,
              bottom: actionMenuPosition.bottom !== undefined ? `${actionMenuPosition.bottom}px` : undefined,
              right: actionMenuPosition.right !== undefined ? `${actionMenuPosition.right}px` : undefined,
            }}
            className="fixed z-50 w-52 bg-white border border-slate-200/90 rounded-xl shadow-2xl py-1.5 text-left animate-in fade-in zoom-in-95 ring-1 ring-black/5 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                const m = actionMenuMaterial;
                setActionMenuOpenId(null);
                setActionMenuPosition(null);
                setActionMenuMaterial(null);
                setSelectedMaterial(m);
                setPreviewMaterial(m);
              }}
              className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center space-x-2 text-left transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>View Document</span>
            </button>

            <button
              onClick={() => {
                const m = actionMenuMaterial;
                setActionMenuOpenId(null);
                setActionMenuPosition(null);
                setActionMenuMaterial(null);
                handleDownloadMaterial(m);
              }}
              className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center space-x-2 text-left transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download Original File</span>
            </button>

            {onNavigate && (
              <button
                onClick={() => {
                  const m = actionMenuMaterial;
                  setActionMenuOpenId(null);
                  setActionMenuPosition(null);
                  setActionMenuMaterial(null);
                  onNavigate("chat", m);
                }}
                className="w-full px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 flex items-center space-x-2 text-left font-medium transition cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ask in AI Study Chat</span>
              </button>
            )}

            {onNavigate && (
              <button
                onClick={() => {
                  const m = actionMenuMaterial;
                  setActionMenuOpenId(null);
                  setActionMenuPosition(null);
                  setActionMenuMaterial(null);
                  onNavigate("notes", m);
                }}
                className="w-full px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50 flex items-center space-x-2 text-left font-medium transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Synthesize Notes</span>
              </button>
            )}

            <div className="my-1 border-t border-slate-100" />

            <button
              onClick={() => {
                const m = actionMenuMaterial;
                setActionMenuOpenId(null);
                setActionMenuPosition(null);
                setActionMenuMaterial(null);
                handleDelete(m.id, m.name);
              }}
              className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 text-left transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Material</span>
            </button>
          </div>
        </>
      )}

      {/* HELP MODAL: "Need help? Learn how to use study materials" */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">How to Use Study Materials</h3>
                  <p className="text-[11px] text-slate-400">Your central curriculum repository</p>
                </div>
              </div>
              <button
                onClick={() => setHelpModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-1">1. Uploading Documents</h4>
                <p className="text-[11px] text-indigo-800">
                  Drag and drop or browse PDF, DOCX, TXT, or slide images. Add a title, subject, and material type.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <h4 className="font-bold text-emerald-900 mb-1">2. Stored Without Synthesizing</h4>
                <p className="text-[11px] text-emerald-800">
                  Uploading only indexes and stores your material. It will <strong>never</strong> generate notes automatically without your explicit command, saving your quota and keeping you in control.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">3. Grounding Across StudyVault AI</h4>
                <p className="text-[11px] text-slate-600">
                  Once status is "Ready", you can reference this material in <strong>AI Study Chat</strong> for syllabus-accurate answers, organize milestones with <strong>Study Planner</strong>, or selectively convert it in <strong>Smart Notes</strong>.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setHelpModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer transition"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW DOCUMENT MODAL (Original Uploaded Format & Download) */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-3">
              <div className="flex items-start space-x-3 min-w-0 flex-1">
                <div className="shrink-0 mt-1">{renderMaterialIcon(previewMaterial)}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-slate-900 break-words [overflow-wrap:anywhere] whitespace-normal leading-snug">
                    {previewMaterial.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-indigo-600 break-words [overflow-wrap:anywhere] whitespace-normal">{previewMaterial.subject}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">{previewMaterial.type}</span>
                    <span>•</span>
                    <span className="uppercase font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      Format: {previewMaterial.fileType || "PDF"}
                    </span>
                    <span>•</span>
                    <span>{previewMaterial.chunkCount || 1} Chunks indexed</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  id="btn-modal-download-material"
                  onClick={() => handleDownloadMaterial(previewMaterial)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
                  title="Download in original format"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* View Format Selector */}
            <div className="flex items-center space-x-2 pt-3 border-b border-slate-100 pb-2 text-xs">
              <button
                onClick={() => setPreviewFormatTab("original")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  previewFormatTab === "original"
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View as Original Uploaded Format</span>
              </button>
              <button
                onClick={() => setPreviewFormatTab("chunks")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  previewFormatTab === "chunks"
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Extracted Text & Indexed Chunks</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto py-3 space-y-4 text-xs pr-1">
              {previewFormatTab === "original" ? (
                /* Authentically rendered original document format canvas */
                <DocumentCanvasViewer
                  material={previewMaterial}
                  dataUrl={previewDocUrl}
                  isLoadingDataUrl={isLoadingPreviewDoc}
                  onDownload={() => handleDownloadMaterial(previewMaterial)}
                />
              ) : (
                /* Raw Indexed Chunks View */
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                      Document Text & Indexed Content
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {(previewMaterial.extractedText || "").length} characters
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 whitespace-pre-wrap leading-relaxed font-mono text-[11px] max-h-96 overflow-y-auto break-words [overflow-wrap:anywhere]">
                    {previewMaterial.extractedText || "No extracted text preview available."}
                  </div>
                </div>
              )}

              {previewMaterial.description && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-xs text-slate-600">
                  <span className="font-semibold text-indigo-900 block mb-0.5">Notes / Description:</span>
                  <p className="break-words [overflow-wrap:anywhere] whitespace-normal">{previewMaterial.description}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => handleDownloadMaterial(previewMaterial)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download File</span>
                </button>

                {onNavigate && (
                  <button
                    onClick={() => {
                      const m = previewMaterial;
                      setPreviewMaterial(null);
                      onNavigate("chat", m);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ask in AI Chat</span>
                  </button>
                )}
                {onNavigate && (
                  <button
                    onClick={() => {
                      const m = previewMaterial;
                      setPreviewMaterial(null);
                      onNavigate("notes", m);
                    }}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Synthesize Notes</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setPreviewMaterial(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MATERIAL MODAL (When user clicks "+ Upload Material" in header or sidebar) */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Upload Study Material</h3>
                  <p className="text-[11px] text-slate-400">PDF, DOCX, TXT, MD, Images (up to 10MB)</p>
                </div>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hidden Direct File Input */}
            <input
              ref={directFileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {/* Dotted Drag & Drop Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => directFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition mt-4 ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50/70"
                  : isProcessingUpload
                  ? "border-indigo-300 bg-indigo-50/40 cursor-wait"
                  : "border-indigo-200/90 bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              {fileToUpload ? (
                <div className="space-y-1">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-1">
                    <FileText className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate max-w-xs mx-auto">
                    {fileToUpload.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                  </p>
                </div>
              ) : (
                <div>
                  <CloudUpload className="w-8 h-8 text-indigo-600 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-900">Drag and drop file here</p>
                  <p className="text-[11px] font-semibold text-indigo-600 hover:underline mt-0.5">
                    or click to browse files
                  </p>
                </div>
              )}
            </div>

            {/* Upload Form Inputs */}
            <form
              onSubmit={async (e) => {
                await handleUploadSubmit(e);
                setUploadModalOpen(false);
              }}
              className="space-y-3.5 mt-4 text-left"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Material Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Operating Systems Lecture 3 Notes"
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <SubjectSelector
                    value={uploadSubject}
                    onChange={(val) => {
                      setUploadSubject(val);
                      setCustomSubject(val);
                    }}
                    label="Subject"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Material Type <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 appearance-none pr-8 cursor-pointer"
                    >
                      <option value="">Select type</option>
                      {materialTypeOptions.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Brief description about this material..."
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingUpload || (!uploadName.trim() && !fileToUpload)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                >
                  {isProcessingUpload ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Indexing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-white" />
                      <span>Upload & Index</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
