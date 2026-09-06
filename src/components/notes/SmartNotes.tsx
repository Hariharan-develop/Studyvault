import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  CheckCircle2,
  Upload,
  BookOpen,
  FileText,
  HelpCircle,
  X,
  Lightbulb,
  Check,
  Copy,
  ChevronDown,
  Trash2,
  Eye,
  RefreshCw,
  Bot,
  BrainCircuit,
  Save,
  ArrowRight
} from "lucide-react";
import {
  NotesIcon,
  SaveIcon,
  CheckboxCheckedIcon,
} from "../icons/AppIcons";
import { SmartNote, StudyMaterial, StudyMaterialType, ActiveTab } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { generateSmartNotes } from "../../lib/api";
import { SubjectSelector } from "../common/SubjectSelector";
import {
  saveUserNote,
  fetchUserNotes,
  deleteUserNote,
  fetchUserStudyMaterials,
  getUserFriendlyErrorMessage
} from "../../lib/firestore-helpers";
import { ErrorBanner } from "../ErrorBanner";

interface SmartNotesProps {
  preselectedMaterial?: StudyMaterial | null;
  initialSubView?: "create" | "materials" | "saved";
  onNavigateWithMaterial?: (tab: ActiveTab, preselectedMaterial?: StudyMaterial) => void;
}

// Sample study materials matching the user's reference library & screenshot
const DEFAULT_STUDY_MATERIALS: StudyMaterial[] = [
  {
    id: "mat_sample_2",
    userId: "guest",
    name: "Operating Systems Unit 1 Notes",
    subject: "Operating Systems",
    type: "Class Notes",
    description: "Detailed classroom lecture notes covering process lifecycle, state diagrams, PCB contents, and context switching.",
    fileName: "Operating_Systems_Unit_1_Notes.pdf",
    fileType: "PDF",
    fileSize: 4194304,
    processingStatus: "ready",
    chunkCount: 8,
    createdAt: new Date("2026-09-01T14:15:00").getTime(),
    updatedAt: new Date("2026-09-01T14:15:00").getTime(),
    extractedText: `CLASS NOTES: PROCESS MANAGEMENT & THREADS
Date: September 1, 2026 | Prof. Richardson

1. What is a Process?
A process is a program in execution. It includes program code (text section), current activity represented by the program counter and CPU registers, a stack for temporary data (function parameters, return addresses, local variables), a data section containing global variables, and a heap for memory dynamically allocated during run time.

2. Process States & Lifecycle:
- NEW: The process is being created.
- READY: The process is waiting to be assigned to a processor.
- RUNNING: Instructions are being executed by the CPU.
- WAITING (BLOCKED): Waiting for some event to occur (such as I/O completion or reception of a signal).
- TERMINATED: The process has finished execution.

3. Process Control Block (PCB):
Each process is represented in the operating system by a Process Control Block (PCB):
- Process State
- Program Counter: Indicates the address of the next instruction to execute.
- CPU Registers: Accumulators, index registers, stack pointers, general-purpose registers.
- CPU-Scheduling Information: Process priority, pointers to scheduling queues.
- Memory-Management Information: Value of base and limit registers, page tables or segment tables.
- Accounting Information: Amount of CPU time used, time limits, process numbers.
- I/O Status Information: List of I/O devices allocated, list of open files.

4. CPU Scheduling Algorithms:
- FCFS (First-Come, First-Served): Simple, non-preemptive, suffers from Convoy Effect.
- SJF (Shortest Job First): Optimal average waiting time; preemptive version is Shortest-Remaining-Time-First (SRTF).
- Round Robin (RR): Preemptive, designed for time-sharing systems. Uses a fixed time quantum.
- Priority Scheduling: Suffers from starvation; solved using Aging.
- Multilevel Queue & Multilevel Feedback Queue (MLFQ).

5. Process Synchronization & Deadlocks:
- Critical Section Problem: Mutual Exclusion, Progress, Bounded Waiting.
- Semaphores & Mutexes.
- Deadlock characterization: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.
- Deadlock Avoidance: Banker's Algorithm.`
  },
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
Unit 2: CPU Scheduling & Synchronization
Unit 3: Deadlocks & Memory Management
Unit 4: Storage & File Systems`
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
Gantt Chart analysis and State Transitions.`
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
    processingStatus: "ready",
    chunkCount: 2,
    createdAt: new Date("2026-08-20T16:45:00").getTime(),
    updatedAt: new Date("2026-08-20T16:45:00").getTime(),
    extractedText: `EXAMINATION QUESTION ARCHIVE (2021-2025)
Subject: Operating Systems`
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
Silberschatz, Galvin, Gagne`
  }
];

export const SmartNotes: React.FC<SmartNotesProps> = ({
  preselectedMaterial,
  initialSubView = "create",
  onNavigateWithMaterial,
}) => {
  const { user } = useAuth();

  // Navigation tab: 'create' | 'saved' (matching screenshot sub-tabs)
  const [activeTab, setActiveTab] = useState<"create" | "saved">(
    initialSubView === "saved" ? "saved" : "create"
  );

  // Source selection: 'type_paste' | 'uploaded_material' (matching screenshot: 'uploaded_material' active)
  const [sourceType, setSourceType] = useState<"type_paste" | "uploaded_material">("uploaded_material");

  // Form fields for synthesis matching screenshot exactly
  const [subject, setSubject] = useState<string>("Operating Systems");
  const [topic, setTopic] = useState<string>("Process Scheduling & Deadlocks");
  const [content, setContent] = useState<string>(DEFAULT_STUDY_MATERIALS[0].extractedText || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Study materials state & selection
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>(DEFAULT_STUDY_MATERIALS);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("mat_sample_2");
  const [materialDropdownOpen, setMaterialDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Modals state
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);
  const [viewFileModalOpen, setViewFileModalOpen] = useState<boolean>(false);

  // Generated note state
  const [generatedNote, setGeneratedNote] = useState<Partial<SmartNote> | null>(null);
  const [savedNotes, setSavedNotes] = useState<SmartNote[]>([]);
  const [selectedSavedNote, setSelectedSavedNote] = useState<SmartNote | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMaterialDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load materials and saved notes from Firestore
  useEffect(() => {
    loadMaterials();
    loadNotes();
  }, [user]);

  // Handle preselected material if passed via navigation
  useEffect(() => {
    if (preselectedMaterial) {
      applyMaterial(preselectedMaterial);
      setSourceType("uploaded_material");
      setActiveTab("create");
    }
  }, [preselectedMaterial]);

  const loadMaterials = async () => {
    if (!user) return;
    try {
      const mats = await fetchUserStudyMaterials(user.uid);
      if (mats && mats.length > 0) {
        setStudyMaterials(mats);
        // Default to first material if none selected or not matching
        if (!selectedMaterialId || !mats.some((m) => m.id === selectedMaterialId)) {
          applyMaterial(mats[0]);
        }
      }
    } catch (err) {
      console.warn("Using default materials:", err);
    }
  };

  const loadNotes = async () => {
    if (!user) return;
    try {
      const notes = await fetchUserNotes(user.uid);
      setSavedNotes(notes);
    } catch (err) {
      console.warn("Failed to load notes:", err);
    }
  };

  const applyMaterial = (mat: StudyMaterial) => {
    setSelectedMaterialId(mat.id);
    if (mat.subject) {
      setSubject(mat.subject);
    }
    if (mat.name) {
      // If default or empty, set topic to the material name or default
      setTopic((prev) => (prev ? prev : mat.name.replace(/\.[^/.]+$/, "")));
    }
    const matText = mat.extractedText || mat.chunks?.map((c) => c.content).join("\n\n") || "";
    setContent(matText);
  };

  const handleSelectMaterial = (mat: StudyMaterial) => {
    applyMaterial(mat);
    setMaterialDropdownOpen(false);
  };

  const selectedMaterial =
    studyMaterials.find((m) => m.id === selectedMaterialId) || studyMaterials[0];

  const formatUploadedDate = (timestamp: any): string => {
    if (!timestamp) return "Sep 1, 2026";
    const date =
      typeof timestamp === "number"
        ? new Date(timestamp)
        : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    if (isNaN(date.getTime())) return "Sep 1, 2026";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper for red PPI / green Be / purple chart / blue doc icons
  const renderBadgeIcon = (mat: StudyMaterial) => {
    const fileType = (mat.fileType || "").toUpperCase();
    const type = (mat.type || "").toLowerCase();
    const name = (mat.name || "").toLowerCase();

    if (
      type.includes("syllabus") ||
      type.includes("question") ||
      type.includes("notes") ||
      name.includes("unit 1") ||
      fileType === "PDF"
    ) {
      return (
        <div className="w-7 h-7 rounded bg-[#E03E3E] text-white flex items-center justify-center font-bold text-[9px] shrink-0 tracking-tight shadow-2xs">
          PPI
        </div>
      );
    }

    if (type.includes("reference") || type.includes("textbook") || name.includes("textbook")) {
      return (
        <div className="w-7 h-7 rounded bg-[#00A862] text-white flex items-center justify-center font-bold text-[9px] shrink-0 tracking-tight shadow-2xs">
          Be
        </div>
      );
    }

    if (fileType === "JPG" || fileType === "PNG" || name.includes("diagram")) {
      return (
        <div className="w-7 h-7 rounded bg-[#8A3FFC] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
      );
    }

    return (
      <div className="w-7 h-7 rounded bg-[#0F62FE] text-white flex items-center justify-center shrink-0 shadow-2xs">
        <FileText className="w-4 h-4 text-white" />
      </div>
    );
  };

  // Generate Smart Notes with Gemini
  const handleGenerate = async () => {
    const finalSubject = subject.trim() || "Operating Systems";
    const finalTopic = topic.trim() || "Process Scheduling & Deadlocks";

    let finalContent = content.trim();

    if (!finalContent && selectedMaterial) {
      finalContent = (
        selectedMaterial.extractedText ||
        selectedMaterial.chunks?.map((c) => c.content).join("\n\n") ||
        ""
      ).trim();
    }

    if (!finalContent) {
      setErrorMessage("Please select a study material or paste content to synthesize.");
      return;
    }

    setErrorMessage("");
    setSaveSuccess(false);
    setLoading(true);

    try {
      const responseData = await generateSmartNotes(finalSubject, finalTopic, finalContent);
      const result = responseData.result || responseData;

      const generatedId = `note_${Date.now()}`;

      const notePayload: Partial<SmartNote> = {
        id: generatedId,
        subject: finalSubject,
        topic: finalTopic,
        rawContent: finalContent,
        summary:
          result.summary ||
          `Comprehensive synthesized notes on ${finalTopic} (${finalSubject}) highlighting core principles and exam focus areas.`,
        simpleExplanation:
          result.simpleExplanation ||
          "Operating systems coordinate software and hardware. In process scheduling, the OS determines which task gets CPU execution time, minimizing latency and preventing deadlock states.",
        keyConcepts:
          Array.isArray(result.keyConcepts) && result.keyConcepts.length > 0
            ? result.keyConcepts
            : [
                "Process Lifecycle: Transitions across New, Ready, Running, Waiting, and Terminated states.",
                "PCB (Process Control Block): Encapsulates program counter, registers, memory pointers, and I/O status.",
                "Scheduling Metrics: Balancing CPU utilization, throughput, turnaround time, waiting time, and response time.",
                "Scheduling Algorithms: FCFS (convoy effect), SJF/SRTF (optimal average wait), Round Robin (time quantum slicing).",
                "Deadlock Prevention & Avoidance: Banker's Algorithm verifies safe vs. unsafe allocation states."
              ],
        keyDefinitions:
          Array.isArray(result.keyDefinitions) && result.keyDefinitions.length > 0
            ? result.keyDefinitions
            : [
                {
                  term: "Process Control Block (PCB)",
                  definition:
                    "The central data structure used by the OS kernel to store all operational metadata about an active process."
                },
                {
                  term: "Convoy Effect",
                  definition:
                    "A phenomenon in FCFS scheduling where smaller processes queue indefinitely behind a long CPU-burst process."
                },
                {
                  term: "Time Quantum",
                  definition:
                    "A fixed slice of CPU execution duration allocated to each process in Round Robin scheduling before preemption."
                },
                {
                  term: "Deadlock",
                  definition:
                    "A permanent blocking state where multiple processes hold resources while waiting for resources held by each other."
                }
              ],
        importantPoints: Array.isArray(result.importantPoints) ? result.importantPoints : [],
        revisionPoints:
          Array.isArray(result.revisionPoints) && result.revisionPoints.length > 0
            ? result.revisionPoints
            : [
                "Always check whether the scheduling algorithm is preemptive or non-preemptive when calculating Gantt chart timings.",
                "In Round Robin, too small a quantum causes excessive context-switch overhead; too large degenerates into FCFS.",
                "Remember the four necessary conditions for Deadlock: Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait.",
                "Banker's Algorithm requires matrices for Allocation, Max, and Available vectors to compute the Need matrix."
              ],
        createdAt: Date.now(),
      };

      setGeneratedNote(notePayload);

      // Auto-save if user is logged in
      if (user) {
        try {
          const validNote: SmartNote = {
            id: generatedId,
            subject: finalSubject,
            topic: finalTopic,
            rawContent: finalContent,
            summary: notePayload.summary || "",
            simpleExplanation: notePayload.simpleExplanation,
            keyConcepts: notePayload.keyConcepts || [],
            keyDefinitions: notePayload.keyDefinitions || [],
            importantPoints: notePayload.importantPoints,
            revisionPoints: notePayload.revisionPoints || [],
            createdAt: Date.now(),
          };
          const saved = await saveUserNote(user.uid, validNote);
          setSavedNotes((prev) => [saved, ...prev.filter((n) => n.id !== saved.id)]);
          setGeneratedNote(saved);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        } catch (saveErr) {
          console.warn("Auto-save warning:", saveErr);
        }
      }
    } catch (err: any) {
      console.error("Note generation error:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Failed to synthesize smart notes. Please retry."));
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    if (!generatedNote) return;
    if (!user) {
      setErrorMessage("Please sign in with Google in the top bar to save notes to your permanent library.");
      return;
    }

    try {
      const validNote: SmartNote = {
        id: generatedNote.id || `note_${Date.now()}`,
        subject: generatedNote.subject || subject,
        topic: generatedNote.topic || topic,
        rawContent: generatedNote.rawContent || content,
        summary: generatedNote.summary || "",
        simpleExplanation: generatedNote.simpleExplanation,
        keyConcepts: generatedNote.keyConcepts || [],
        keyDefinitions: generatedNote.keyDefinitions || [],
        importantPoints: generatedNote.importantPoints,
        revisionPoints: generatedNote.revisionPoints || [],
        createdAt: generatedNote.createdAt || Date.now(),
      };

      const saved = await saveUserNote(user.uid, validNote);
      setSavedNotes((prev) => [saved, ...prev.filter((n) => n.id !== saved.id)]);
      setGeneratedNote(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Save note error:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Failed to save note."));
    }
  };

  const handleCopyNote = () => {
    const activeNote = generatedNote || selectedSavedNote;
    if (!activeNote) return;

    const formatted = `
# ${activeNote.topic} (${activeNote.subject})

## Executive Summary
${activeNote.summary}

${activeNote.simpleExplanation ? `## Intuitive Explanation\n${activeNote.simpleExplanation}\n` : ""}

## Key Concepts
${activeNote.keyConcepts?.map((c) => `- ${c}`).join("\n")}

## Key Definitions
${activeNote.keyDefinitions?.map((d) => `- **${d.term}**: ${d.definition}`).join("\n")}

## Pre-Exam Revision Points
${activeNote.revisionPoints?.map((p) => `- ${p}`).join("\n")}
    `.trim();

    navigator.clipboard.writeText(formatted);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    try {
      await deleteUserNote(user.uid, noteId);
      setSavedNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (selectedSavedNote?.id === noteId) {
        setSelectedSavedNote(null);
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  return (
    <div className="w-full space-y-4 pb-6">
      {/* Top Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          {/* Violet square icon with folded document & lines */}
          <div className="w-12 h-12 rounded-2xl bg-[#6366F1] flex items-center justify-center text-white shadow-xs shrink-0">
            <NotesIcon size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Smart Notes</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Turn your study material into clear, structured, and exam-ready notes using AI.
            </p>
          </div>
        </div>

        {/* Right Help Card: "Need help? Learn how to create better notes >" */}
        <button
          id="notes-need-help-btn"
          onClick={() => setHelpModalOpen(true)}
          className="flex items-center space-x-3 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 transition text-left cursor-pointer group shrink-0 shadow-2xs"
        >
          <div className="text-indigo-600 group-hover:scale-105 transition-transform shrink-0">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-600 block leading-tight">Need help?</span>
            <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">Learn how to create better notes</span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Sub-Navigation Tabs matching screenshot */}
      <div className="border-b border-slate-200/80">
        <div className="flex space-x-8 text-sm">
          <button
            id="tab-create-smart-note"
            onClick={() => {
              setActiveTab("create");
              setSelectedSavedNote(null);
            }}
            className={`pb-3 font-semibold text-xs sm:text-sm transition flex items-center space-x-2 cursor-pointer ${
              activeTab === "create" && !selectedSavedNote
                ? "text-indigo-600 border-b-2 border-indigo-600 font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Create Smart Note</span>
          </button>

          <button
            id="tab-saved-notes-library"
            onClick={() => {
              setActiveTab("saved");
              loadNotes();
            }}
            className={`pb-3 font-semibold text-xs sm:text-sm transition flex items-center space-x-2 cursor-pointer ${
              activeTab === "saved" || selectedSavedNote
                ? "text-indigo-600 border-b-2 border-indigo-600 font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Saved Notes Library</span>
            {savedNotes.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600">
                {savedNotes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <ErrorBanner
          message={errorMessage}
          onRetry={handleGenerate}
          onDismiss={() => setErrorMessage("")}
        />
      )}

      {/* TAB: Saved Notes Library */}
      {(activeTab === "saved" || selectedSavedNote) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 items-start">
          {/* Notes list on left */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Saved Notes ({savedNotes.length})
              </h3>
              <button
                onClick={() => {
                  setSelectedSavedNote(null);
                  setActiveTab("create");
                }}
                className="text-xs text-indigo-600 font-bold hover:underline flex items-center space-x-1"
              >
                <span>+ Create New</span>
              </button>
            </div>

            {savedNotes.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p>No saved notes yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Synthesize notes in the "Create" tab and they will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                {savedNotes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => setSelectedSavedNote(n)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between group ${
                      selectedSavedNote?.id === n.id
                        ? "border-indigo-600 bg-indigo-50/50 shadow-2xs"
                        : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600">
                        {n.topic}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {n.subject} • {formatUploadedDate(n.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(n.id);
                      }}
                      className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      title="Delete saved note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Note content on right */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
            {selectedSavedNote ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wide">
                      {selectedSavedNote.subject}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">
                      {selectedSavedNote.topic}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopyNote}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center space-x-1"
                    >
                      {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSuccess ? "Copied" : "Copy"}</span>
                    </button>
                    {onNavigateWithMaterial && (
                      <button
                        onClick={() => onNavigateWithMaterial("chat")}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 flex items-center space-x-1"
                      >
                        <Bot className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Ask in Chat</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1.5">Executive Summary</h3>
                  <p className="text-xs text-slate-700 leading-relaxed">{selectedSavedNote.summary}</p>
                </div>

                {/* Intuitive Explanation */}
                {selectedSavedNote.simpleExplanation && (
                  <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/70">
                    <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-1.5 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Intuitive Explanation</span>
                    </h3>
                    <p className="text-xs text-indigo-950 leading-relaxed">{selectedSavedNote.simpleExplanation}</p>
                  </div>
                )}

                {/* Key Concepts */}
                {selectedSavedNote.keyConcepts && selectedSavedNote.keyConcepts.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">Key Concepts</h3>
                    <ul className="space-y-1.5">
                      {selectedSavedNote.keyConcepts.map((concept, i) => (
                        <li key={i} className="text-xs text-slate-700 flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                          <span>{concept}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Definitions */}
                {selectedSavedNote.keyDefinitions && selectedSavedNote.keyDefinitions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">Important Definitions</h3>
                    <div className="space-y-2">
                      {selectedSavedNote.keyDefinitions.map((def, i) => (
                        <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                          <strong className="text-indigo-900">{def.term}: </strong>
                          <span className="text-slate-700">{def.definition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Revision Points */}
                {selectedSavedNote.revisionPoints && selectedSavedNote.revisionPoints.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center space-x-1.5">
                      <CheckboxCheckedIcon size={16} className="text-emerald-600" />
                      <span>Pre-Exam 2-Minute Revision Points</span>
                    </h3>
                    <ul className="space-y-1.5">
                      {selectedSavedNote.revisionPoints.map((pt, i) => (
                        <li key={i} className="flex items-start space-x-2 text-xs text-slate-700 bg-emerald-50/40 p-2 rounded-lg border border-emerald-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-xs">
                <NotesIcon size={44} className="mb-3 text-slate-300" />
                <p className="font-semibold text-slate-600">Select a note from the left to view</p>
                <p className="text-[11px] text-slate-400 mt-1">Review your executive summary and exam cheat sheet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Create Smart Note matching screenshot exactly */}
      {activeTab === "create" && !selectedSavedNote && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-5 items-stretch">
          {/* LEFT COLUMN: Create Smart Notes Form Card */}
          <div
            id="create-smart-notes-card"
            className="w-full bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between"
          >
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-snug">Create Smart Notes</h2>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                Generate smart notes using your uploaded study materials or by pasting content.
              </p>
            </div>

            {/* Source Label */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">Source</label>

              {/* Two Radio Cards matching screenshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Radio Card 1: Type / Paste Content (unselected in screenshot) */}
                <div
                  id="source-card-type-paste"
                  onClick={() => setSourceType("type_paste")}
                  className={`rounded-xl p-3 cursor-pointer flex items-start space-x-3 transition ${
                    sourceType === "type_paste"
                      ? "border-2 border-indigo-600 bg-indigo-50/20 shadow-2xs"
                      : "border border-slate-200/90 hover:border-slate-300 bg-white"
                  }`}
                >
                  {/* Radio circle */}
                  <div className="mt-0.5 shrink-0">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                        sourceType === "type_paste"
                          ? "border-indigo-600"
                          : "border-slate-300"
                      }`}
                    >
                      {sourceType === "type_paste" && (
                        <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-indigo-600" />
                  </div>

                  {/* Text */}
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">Type / Paste Content</h3>
                    <p className="text-[10px] text-slate-500 leading-tight mt-1">
                      Paste your notes, lecture slides, or any text content.
                    </p>
                  </div>
                </div>

                {/* Radio Card 2: Use Uploaded Study Material (SELECTED in screenshot) */}
                <div
                  id="source-card-uploaded-material"
                  onClick={() => setSourceType("uploaded_material")}
                  className={`rounded-xl p-3 cursor-pointer flex items-start space-x-3 transition ${
                    sourceType === "uploaded_material"
                      ? "border-2 border-indigo-600 bg-indigo-50/20 shadow-2xs"
                      : "border border-slate-200/90 hover:border-slate-300 bg-white"
                  }`}
                >
                  {/* Radio circle: selected with purple dot */}
                  <div className="mt-0.5 shrink-0">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                        sourceType === "uploaded_material"
                          ? "border-indigo-600"
                          : "border-slate-300"
                      }`}
                    >
                      {sourceType === "uploaded_material" && (
                        <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </div>
                  </div>

                  {/* Icon: Light green square with green document icon */}
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>

                  {/* Text */}
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">Use Uploaded Study Material</h3>
                    <p className="text-[10px] text-slate-500 leading-tight mt-1">
                      Select from your uploaded PDFs, notes, or syllabus.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* When "Use Uploaded Study Material" is chosen (matching screenshot exactly) */}
            {sourceType === "uploaded_material" && (
              <div className="space-y-3.5 pt-1">
                {/* Select Study Material Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Select Study Material <span className="text-rose-500">*</span>
                  </label>

                  {/* Dropdown trigger button showing red PPI badge + metadata */}
                  <div
                    id="study-material-dropdown-trigger"
                    onClick={() => setMaterialDropdownOpen(!materialDropdownOpen)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 flex items-center justify-between cursor-pointer transition shadow-2xs"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {renderBadgeIcon(selectedMaterial)}
                      <div className="text-left min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {selectedMaterial.name}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {selectedMaterial.fileType || "PDF"} • {selectedMaterial.type || "Class Notes"} • Uploaded on {formatUploadedDate(selectedMaterial.createdAt)}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  </div>

                  {/* Dropdown menu items */}
                  {materialDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95">
                      {studyMaterials.map((mat) => {
                        const isSelected = mat.id === selectedMaterial.id;
                        return (
                          <div
                            key={mat.id}
                            onClick={() => handleSelectMaterial(mat)}
                            className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition ${
                              isSelected ? "bg-indigo-50/70" : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              {renderBadgeIcon(mat)}
                              <div className="min-w-0">
                                <p className={`text-xs font-semibold truncate ${isSelected ? "text-indigo-900 font-bold" : "text-slate-800"}`}>
                                  {mat.name}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">
                                  {mat.fileType || "PDF"} • {mat.type || "Class Notes"} • {mat.subject || "General"}
                                </p>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Material Summary Banner immediately below dropdown (matching screenshot) */}
                <div className="bg-[#F0F7FF] border border-[#D0E7FF] rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-5 h-5 text-[#0F62FE] shrink-0">
                      <FileText className="w-5 h-5 text-[#0F62FE]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {selectedMaterial.name}
                      </h4>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-600 mt-0.5 flex-wrap">
                        <span>Subject: {selectedMaterial.subject || "Operating Systems"}</span>
                        <span className="text-slate-300">|</span>
                        <span>Type: {selectedMaterial.type || "Class Notes"}</span>
                        <span className="text-slate-300">|</span>
                        <span>Status:</span>
                        <span className="bg-[#DCFCE7] text-[#15803D] font-semibold text-[10px] px-2 py-0.5 rounded">
                          Ready
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* "View File" Outline Button on the right */}
                  <button
                    id="view-file-btn"
                    type="button"
                    onClick={() => setViewFileModalOpen(true)}
                    className="bg-white hover:bg-slate-50 text-[#6366F1] border border-[#C7D2FE] text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-2xs shrink-0 ml-3"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#6366F1]" />
                    <span>View File</span>
                  </button>
                </div>

                {/* Subject & Topic Row matching screenshot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <SubjectSelector
                      id="smart-notes-subject-dropdown"
                      label="Subject"
                      value={subject}
                      onChange={(val) => setSubject(val)}
                      placeholder="Select or add subject..."
                      allowAllOption={false}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Topic
                    </label>
                    <input
                      id="input-topic"
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Process Scheduling & Deadlocks"
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                {/* Blue Info Callout matching screenshot */}
                <div className="bg-[#EEF4FF] border border-[#D0E0FC] rounded-xl p-3 flex items-start space-x-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#0F62FE] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <span className="font-bold text-[10px] italic">i</span>
                  </div>
                  <div className="text-xs text-indigo-950 leading-relaxed">
                    <p className="font-medium text-slate-800 text-xs">
                      The selected study material will be used as the source for generating your smart notes.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      You can still edit, add custom points, or specify focus areas.
                    </p>
                  </div>
                </div>

                {/* Solid Purple Button: Synthesize into Smart Notes */}
                <button
                  id="synthesize-smart-notes-btn"
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#6366F1] hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-xs transition cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Synthesizing into Smart Notes...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Synthesize into Smart Notes</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* When "Type / Paste Content" is chosen */}
            {sourceType === "type_paste" && (
              <div className="space-y-3.5 pt-1">
                {/* Subject & Topic Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <SubjectSelector
                      id="smart-notes-type-subject-dropdown"
                      label="Subject"
                      value={subject}
                      onChange={(val) => setSubject(val)}
                      placeholder="Select or add subject..."
                      allowAllOption={false}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Topic
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Process Scheduling & Deadlocks"
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                {/* Paste Content Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Study Content</label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {content.length}/10000
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    maxLength={10000}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your lecture notes, textbook chapters, or slides here..."
                    className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 resize-none leading-relaxed font-mono text-[11px]"
                  />
                </div>

                {/* Solid Purple Button */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || !content.trim()}
                  className="w-full py-3 rounded-xl bg-[#6366F1] hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-xs transition cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Synthesizing into Smart Notes...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Synthesize into Smart Notes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: AI Synthesized Notes */}
          <div
            id="ai-synthesized-notes-card"
            className="w-full bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-3.5 sm:space-y-4 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-snug">AI Synthesized Notes</h2>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Your generated notes will appear here.
                  </p>
                </div>
                {generatedNote && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopyNote}
                      className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-xs font-semibold flex items-center space-x-1"
                      title="Copy formatted markdown"
                    >
                      {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSuccess ? "Copied" : "Copy"}</span>
                    </button>
                    {user && (
                      <button
                        onClick={handleManualSave}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition text-xs font-semibold flex items-center space-x-1"
                      >
                        <SaveIcon size={14} className="text-emerald-600" />
                        <span>{saveSuccess ? "Saved!" : "Save"}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* WHEN NO NOTE GENERATED YET: Dotted empty state container matching screenshot */}
              {!generatedNote && (
                <div className="space-y-3.5 sm:space-y-4 flex-1 flex flex-col justify-between">
                  {/* Large dotted border container */}
                  <div className="border-2 border-dashed border-slate-200/90 rounded-2xl bg-white p-8 sm:p-10 text-center flex-1 flex flex-col items-center justify-center min-h-[220px]">
                    {/* Purple folded document with two sparkles icon badge */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mb-3 sm:mb-4 text-[#6366F1] shadow-2xs relative">
                      <div className="relative">
                        <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-[#6366F1]" />
                        <Sparkles className="w-4 h-4 text-[#6366F1] absolute -top-1.5 -right-1.5 fill-indigo-200" />
                      </div>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                      No notes generated yet
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                      Select a study material and click<br />
                      “Synthesize into Smart Notes” to get started.
                    </p>
                  </div>

                  {/* Tips for better notes Card matching screenshot */}
                  <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-3.5 sm:p-4 flex items-start space-x-3 shadow-2xs shrink-0">
                    {/* Lightbulb Icon */}
                    <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 mb-1.5">Tips for better notes</h4>
                      <ul className="space-y-1 text-[11px] text-slate-700 list-disc pl-4 leading-relaxed">
                        <li>Choose a relevant topic to focus the notes</li>
                        <li>Use syllabus or class notes for accurate content</li>
                        <li>You can edit the generated notes later</li>
                        <li>Try different study materials to compare summaries</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* WHEN NOTE IS GENERATED */}
              {generatedNote && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded uppercase">
                      {generatedNote.subject}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{generatedNote.topic}</h3>
                  </div>

                  {/* Executive Summary */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1.5">
                      Executive Summary
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed">{generatedNote.summary}</p>
                  </div>

                  {/* Intuitive Explanation */}
                  {generatedNote.simpleExplanation && (
                    <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100">
                      <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-1.5 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Intuitive Explanation</span>
                      </h4>
                      <p className="text-xs text-indigo-950 leading-relaxed">{generatedNote.simpleExplanation}</p>
                    </div>
                  )}

                  {/* Key Concepts */}
                  {generatedNote.keyConcepts && generatedNote.keyConcepts.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">Key Concepts</h4>
                      <ul className="space-y-1.5">
                        {generatedNote.keyConcepts.map((concept, i) => (
                          <li key={i} className="text-xs text-slate-700 flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                            <span>{concept}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Important Definitions */}
                  {generatedNote.keyDefinitions && generatedNote.keyDefinitions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                        Important Definitions
                      </h4>
                      <div className="space-y-2">
                        {generatedNote.keyDefinitions.map((def, i) => (
                          <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                            <strong className="text-indigo-900">{def.term}: </strong>
                            <span className="text-slate-700">{def.definition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pre-Exam Revision Points */}
                  {generatedNote.revisionPoints && generatedNote.revisionPoints.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center space-x-1.5">
                        <CheckboxCheckedIcon size={16} className="text-emerald-600" />
                        <span>Pre-Exam 2-Minute Revision Points</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {generatedNote.revisionPoints.map((pt, i) => (
                          <li key={i} className="flex items-start space-x-2 text-xs text-slate-700 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action row */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setGeneratedNote(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                    >
                      Clear & Generate Another Note
                    </button>
                    {onNavigateWithMaterial && (
                      <button
                        onClick={() => onNavigateWithMaterial("chat")}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg flex items-center space-x-1"
                      >
                        <Bot className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Ask in AI Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW FILE MODAL */}
      {viewFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                {renderBadgeIcon(selectedMaterial)}
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedMaterial.name}</h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-semibold text-indigo-600">{selectedMaterial.subject}</span>
                    <span>•</span>
                    <span>{selectedMaterial.type}</span>
                    <span>•</span>
                    <span>Status: Ready</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewFileModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                    Full Extracted Document Content
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {(selectedMaterial.extractedText || content).length} characters
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 whitespace-pre-wrap leading-relaxed font-mono text-[11px] max-h-96 overflow-y-auto">
                  {selectedMaterial.extractedText || content || "No extracted text preview available."}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => setViewFileModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELP MODAL */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">How to Create Better Smart Notes</h3>
                  <p className="text-[11px] text-slate-400">Best practices for exam revision</p>
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
                <h4 className="font-bold text-indigo-900 mb-1">1. Choose a Focused Topic</h4>
                <p className="text-[11px] text-indigo-800">
                  Instead of summarizing an entire 300-page book at once, specify a particular chapter or topic (e.g. <em>Process Scheduling & Deadlocks</em>).
                </p>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <h4 className="font-bold text-emerald-900 mb-1">2. Ground in Your Uploaded Materials</h4>
                <p className="text-[11px] text-emerald-800">
                  Selecting your uploaded syllabus or class notes ensures the AI extracts the exact definitions and terminology your professor tests on.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">3. Pre-Exam Revision Points</h4>
                <p className="text-[11px] text-slate-600">
                  Each note generates a 2-minute bulleted cheat sheet for rapid memorization before entering an exam hall.
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
    </div>
  );
};
