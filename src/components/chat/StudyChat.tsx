import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Check,
  Copy,
  BookOpen,
  SlidersHorizontal,
  PenTool,
  Layers,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Info,
  CheckSquare,
  Square,
  Bookmark
} from "lucide-react";
import {
  ChatIcon,
  PlusIcon,
  TrashIcon,
  BotIcon,
  RefreshIcon,
  SendIcon,
  StudySessionIcon,
} from "../icons/AppIcons";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  ChatSession,
  ChatMessage,
  StudyMaterial,
  SourceMode,
  AnswerFormat,
  ReferencedSource,
} from "../../types";
import { useAuth } from "../../context/AuthContext";
import { askStudyChat } from "../../lib/api";
import {
  saveChatSession,
  fetchUserChats,
  deleteUserChat,
  fetchUserStudyMaterials,
  saveUserStudyInstructions,
  fetchUserStudyInstructions,
  getUserFriendlyErrorMessage,
} from "../../lib/firestore-helpers";
import { ErrorBanner } from "../ErrorBanner";
import { collection, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { HandwrittenPageRenderer } from "./HandwrittenPageRenderer";

function CodeBlock({ children, className, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const codeString = String(children).replace(/\n$/, "");
  
  if (!match && !codeString.includes("\n")) {
    return (
      <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-indigo-700 font-mono text-xs border border-slate-200/80 font-medium" {...props}>
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 text-slate-100 shadow-sm not-prose">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 font-mono">
        <span className="uppercase tracking-wider text-[11px] font-semibold text-indigo-400">
          {match ? match[1] : "code"}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center space-x-1 hover:text-white transition-colors text-[11px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed bg-slate-900 text-slate-100 m-0">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

function ChatMarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="markdown-body text-sm leading-relaxed text-slate-800">
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code: CodeBlock,
          table: ({ children }) => (
            <div className="my-3.5 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs not-prose">
              <table className="min-w-full text-left text-xs border-collapse divide-y divide-slate-200">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100/90 text-slate-800 font-bold border-b border-slate-200">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-100 bg-white">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-50/70 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-bold text-slate-900 uppercase tracking-wider text-[11px] border-r border-slate-200 last:border-r-0 whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2.5 text-slate-700 align-top border-r border-slate-100 last:border-r-0 leading-relaxed text-xs">
              {children}
            </td>
          ),
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-slate-900 mt-3.5 mb-1.5 pb-0.5 border-b border-slate-100">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold text-slate-800 mt-3 mb-1">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-bold text-slate-800 mt-2.5 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 text-slate-700 leading-relaxed text-sm last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-5 space-y-1 mb-3 text-slate-700 text-sm">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-5 space-y-1 mb-3 text-slate-700 text-sm">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-500 pl-3.5 py-1.5 my-2.5 bg-indigo-50/50 rounded-r-xl text-slate-700 text-xs italic leading-relaxed">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3.5 border-slate-200" />,
          strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-800">{children}</em>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline font-medium">
              {children}
            </a>
          )
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}

interface StudyChatProps {
  preselectedMaterial?: StudyMaterial | null;
  onNavigateToMaterials?: () => void;
}

export const StudyChat: React.FC<StudyChatProps> = ({
  preselectedMaterial,
  onNavigateToMaterials,
}) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [subject, setSubject] = useState<string>("Computer Science");
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [savedStatus, setSavedStatus] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Study Materials & Grounding State
  const [userMaterials, setUserMaterials] = useState<StudyMaterial[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [sourceMode, setSourceMode] = useState<SourceMode>("materials_plus_gemini");
  const [answerFormat, setAnswerFormat] = useState<AnswerFormat>("both");
  const [studyInstructions, setStudyInstructions] = useState<string>("");
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [showSourceSelector, setShowSourceSelector] = useState<boolean>(false);

  // Mode tabs for viewing response (per message or globally)
  const [activeViewMode, setActiveViewMode] = useState<Record<string, "text" | "handwritten">>({});

  // Preset instructions
  const instructionPresets = [
    { label: "16-Mark University Exam", text: "Answer formatted as a 16-mark university answer: introduction, definition, main concepts with underlined sub-headings, bulleted points, diagrams, and conclusion." },
    { label: "Simple English", text: "Explain in very simple, jargon-free English with everyday analogies." },
    { label: "Tanglish (Tamil + English)", text: "Explain the concept in friendly Tanglish (Tamil phrases mixed with English technical terms) for easy conceptual clarity." },
    { label: "Step-by-step Formulas", text: "Provide detailed step-by-step mathematical derivations with formula boxes and variable definitions." },
    { label: "Quick Revision (2-Mark)", text: "Provide a crisp 2-mark answer: exact textbook definition plus two key bullet points." },
  ];

  const samplePrompts = [
    "Explain CPU scheduling algorithms with Gantt chart comparison from my notes.",
    "What are the 4 conditions for Deadlock according to my study materials?",
    "Write a 16-mark answer on Object Oriented Programming principles with examples.",
    "Derive the time complexity for Merge Sort step by step.",
  ];

  // Load user chats & study materials on mount
  useEffect(() => {
    if (!user) return;
    loadChats();
    loadMaterials();
    loadInstructions();
  }, [user]);

  // Handle preselected material passed via navigation
  useEffect(() => {
    if (preselectedMaterial) {
      setSelectedMaterialIds((prev) =>
        prev.includes(preselectedMaterial.id) ? prev : [...prev, preselectedMaterial.id]
      );
      if (preselectedMaterial.subject) {
        setSubject(preselectedMaterial.subject);
      }
      setSourceMode("materials_plus_gemini");
    }
  }, [preselectedMaterial]);

  const loadChats = async () => {
    if (!user) return;
    try {
      const userChats = await fetchUserChats(user.uid);
      setChats(userChats);
      if (userChats.length > 0 && !currentChatId) {
        selectChat(userChats[0]);
      } else if (userChats.length === 0) {
        startNewChat();
      }
    } catch (err: any) {
      console.error("Failed to load chats:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Could not load past chat sessions."));
    }
  };

  const loadMaterials = async () => {
    if (!user) return;
    try {
      const mats = await fetchUserStudyMaterials(user.uid);
      setUserMaterials(mats);
      // If user has materials and none selected, auto-select ready ones
      if (mats.length > 0 && selectedMaterialIds.length === 0 && !preselectedMaterial) {
        setSelectedMaterialIds(mats.filter((m) => m.processingStatus === "ready").slice(0, 3).map((m) => m.id));
      }
    } catch (err) {
      console.error("Failed to load materials for chat grounding:", err);
    }
  };

  const loadInstructions = async () => {
    if (!user) return;
    try {
      const savedInstr = await fetchUserStudyInstructions(user.uid);
      if (savedInstr) {
        setStudyInstructions(savedInstr);
      }
    } catch {
      // Non-blocking
    }
  };

  const selectChat = (chat: ChatSession) => {
    setCurrentChatId(chat.id);
    setSubject(chat.subject || "Computer Science");
    setMessages(chat.messages || []);
    setErrorMessage("");
    if (chat.sourceMode) setSourceMode(chat.sourceMode);
    if (chat.answerFormat) setAnswerFormat(chat.answerFormat);
    if (chat.selectedMaterialIds) setSelectedMaterialIds(chat.selectedMaterialIds);
  };

  const startNewChat = () => {
    const newId = user ? doc(collection(db, "users", user.uid, "chats")).id : `chat_${Date.now()}`;
    setCurrentChatId(newId);
    setMessages([]);
    setInputPrompt("");
    setErrorMessage("");
    setSavedStatus(false);
    setActiveViewMode({});
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatIdToDelete: string) => {
    e.stopPropagation();
    if (!chatIdToDelete) return;
    try {
      if (user) {
        await deleteUserChat(user.uid, chatIdToDelete);
      }
      const remaining = chats.filter((c) => c.id !== chatIdToDelete);
      setChats(remaining);
      if (currentChatId === chatIdToDelete) {
        if (remaining.length > 0) {
          selectChat(remaining[0]);
        } else {
          startNewChat();
        }
      }
    } catch (err: any) {
      console.error("Failed to delete chat:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Could not delete conversation."));
    }
  };

  // Toggle material selection
  const toggleMaterial = (id: string) => {
    setSelectedMaterialIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllMaterials = () => {
    setSelectedMaterialIds(userMaterials.map((m) => m.id));
  };

  const handleClearMaterials = () => {
    setSelectedMaterialIds([]);
  };

  const handleSaveInstructions = async (text: string) => {
    setStudyInstructions(text);
    if (user) {
      try {
        await saveUserStudyInstructions(user.uid, text);
      } catch (err) {
        console.warn("Could not persist instructions:", err);
      }
    }
  };

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || loading) return;

    setErrorMessage("");
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      text: prompt,
      timestamp: Date.now(),
      sourceMode,
      answerFormat,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputPrompt("");
    setLoading(true);

    try {
      // Multi-turn payload
      const historyPayload = updatedMessages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      // Gather full objects for selected materials
      const selectedMaterialsObjects = userMaterials.filter((m) =>
        selectedMaterialIds.includes(m.id)
      );

      const response = await askStudyChat(historyPayload, subject, {
        sourceMode,
        studyInstructions,
        answerFormat,
        selectedMaterials: selectedMaterialsObjects,
      });

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: "model",
        text: response.reply,
        timestamp: Date.now(),
        sourceMode: response.sourceMode || sourceMode,
        answerFormat: response.answerFormat || answerFormat,
        referencedSources: response.referencedSources || [],
        modelUsed: response.modelUsed,
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // Save to Firestore or Local state
      const chatTitle =
        messages.length === 0
          ? prompt.slice(0, 40) + (prompt.length > 40 ? "..." : "")
          : chats.find((c) => c.id === currentChatId)?.title || "Study Session";

      const targetId = currentChatId || (user ? doc(collection(db, "users", user.uid, "chats")).id : `chat_${Date.now()}`);

      const sessionObj: ChatSession = {
        id: targetId,
        title: chatTitle,
        subject,
        messages: finalMessages,
        sourceMode,
        answerFormat,
        selectedMaterialIds,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      if (user) {
        const saved = await saveChatSession(user.uid, sessionObj);
        setCurrentChatId(saved.id);

        setChats((prev) => {
          const index = prev.findIndex((c) => c.id === saved.id);
          if (index >= 0) {
            const clone = [...prev];
            clone[index] = saved;
            return clone;
          }
          return [saved, ...prev];
        });

        setSavedStatus(true);
        setTimeout(() => setSavedStatus(false), 3000);
      } else {
        setCurrentChatId(sessionObj.id);
        setChats((prev) => {
          const index = prev.findIndex((c) => c.id === sessionObj.id);
          if (index >= 0) {
            const clone = [...prev];
            clone[index] = sessionObj;
            return clone;
          }
          return [sessionObj, ...prev];
        });
      }
    } catch (err: any) {
      console.error("Chat failure:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Failed to communicate with Gemini. Please retry."));
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
      if (lastUserMsg) {
        handleSendMessage(lastUserMsg.text);
      }
    }
  };

  const selectedMaterialsCount = selectedMaterialIds.length;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8.5rem)] gap-4">
      {/* Left Conversations Sidebar */}
      <div className="w-full lg:w-72 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs shrink-0">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5 uppercase tracking-wider">
              <ChatIcon size={14} className="text-indigo-600" />
              <span>Study Chats</span>
            </h2>
            <button
              id="new-chat-button"
              onClick={startNewChat}
              className="flex items-center space-x-1 text-xs font-semibold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
            >
              <PlusIcon size={12} />
              <span>New</span>
            </button>
          </div>

          <div className="mb-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Subject Context
            </label>
            <input
              id="chat-subject-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Operating Systems, Physics"
              className="w-full text-xs px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Chat List */}
          <div className="space-y-1.5 overflow-y-auto max-h-[38vh] pr-1">
            {messages.length === 0 && (
              <div
                className="flex items-center justify-between p-2.5 rounded-xl text-xs bg-indigo-50/90 text-indigo-700 font-semibold border border-indigo-200 shadow-2xs animate-in fade-in"
              >
                <div className="truncate flex-1">
                  <p className="truncate font-bold flex items-center space-x-1">
                    <Sparkles className="h-3 w-3 text-indigo-600" />
                    <span>New Study Session</span>
                  </p>
                  <span className="text-[10px] text-indigo-500 font-medium">
                    Active • Ask anything below
                  </span>
                </div>
              </div>
            )}
            {chats.length === 0 && messages.length > 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No saved chats yet.</p>
            ) : (
              chats.map((c) => (
                <div
                  key={c.id}
                  id={`chat-item-${c.id}`}
                  onClick={() => selectChat(c)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl text-xs transition cursor-pointer ${
                    c.id === currentChatId
                      ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100"
                      : "text-slate-700 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div className="truncate flex-1 pr-2">
                    <p className="truncate font-semibold">{c.title || "Untitled Chat"}</p>
                    <span className={`text-[10px] ${c.id === currentChatId ? "text-indigo-500" : "text-slate-400"}`}>
                      {c.messages?.length || 0} msgs • {c.subject || "General"}
                    </span>
                  </div>
                  <button
                    id={`delete-chat-${c.id}`}
                    onClick={(e) => handleDeleteChat(e, c.id)}
                    title="Delete Chat"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded transition"
                  >
                    <TrashIcon size={12} className="text-slate-400 hover:text-red-600" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Sources Quick-Summary */}
        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600">Active Sources:</span>
            <span className="font-bold text-indigo-600">{selectedMaterialsCount} selected</span>
          </div>
          {savedStatus && (
            <span className="flex items-center text-emerald-600 font-medium">
              <Check className="h-3 w-3 mr-1" /> Saved to Firestore
            </span>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs overflow-hidden">
        {/* Top Control Bar: Source Mode + Sources Selector + Instructions + Answer Format */}
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Source Grounding Mode Selector */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setSourceMode("materials_only")}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                sourceMode === "materials_only"
                  ? "bg-indigo-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Strict Grounding: Gemini will only answer using your selected study materials"
            >
              Selected Materials Only
            </button>
            <button
              onClick={() => setSourceMode("materials_plus_gemini")}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                sourceMode === "materials_plus_gemini"
                  ? "bg-indigo-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Grounded First: Uses your materials, clearly labels supplemental knowledge"
            >
              Selected + Gemini
            </button>
            <button
              onClick={() => setSourceMode("gemini_only")}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                sourceMode === "gemini_only"
                  ? "bg-indigo-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="General AI tutoring"
            >
              Gemini Only
            </button>
          </div>

          {/* Right: Sources Selector & Study Instructions & Answer Format */}
          <div className="flex items-center space-x-2">
            {/* Study Sources Selector Button */}
            <button
              id="study-sources-toggle"
              onClick={() => setShowSourceSelector(!showSourceSelector)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                selectedMaterialsCount > 0
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
              <span>Sources ({selectedMaterialsCount})</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {/* Study Instructions Toggle */}
            <button
              id="study-instructions-toggle"
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                studyInstructions.trim()
                  ? "bg-amber-50 border-amber-200 text-amber-800 font-bold"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              title="Configure custom formatting (e.g. 16-mark answer, Tanglish, simple English)"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-amber-600" />
              <span>Instructions {studyInstructions.trim() ? "•" : ""}</span>
            </button>

            {/* Answer Format Switcher */}
            <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 text-[11px]">
              <button
                onClick={() => setAnswerFormat("text")}
                className={`px-2 py-1 rounded-lg transition ${
                  answerFormat === "text" ? "bg-slate-800 text-white font-bold" : "text-slate-600"
                }`}
              >
                Text
              </button>
              <button
                onClick={() => setAnswerFormat("handwritten")}
                className={`px-2 py-1 rounded-lg transition ${
                  answerFormat === "handwritten" ? "bg-indigo-600 text-white font-bold" : "text-slate-600"
                }`}
                title="Generates handwritten lined notebook page"
              >
                Handwritten
              </button>
              <button
                onClick={() => setAnswerFormat("both")}
                className={`px-2 py-1 rounded-lg transition ${
                  answerFormat === "both" ? "bg-indigo-600 text-white font-bold" : "text-slate-600"
                }`}
                title="Text Markdown + Handwritten Notebook Page"
              >
                Both
              </button>
            </div>
          </div>
        </div>

        {/* Study Sources Dropdown Drawer */}
        {showSourceSelector && (
          <div className="bg-white border-b border-slate-200 p-4 shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Select Grounding Study Materials</h4>
                <p className="text-[11px] text-slate-500">
                  Gemini will actively search and ground answers in the checked materials.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={handleSelectAllMaterials}
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={handleClearMaterials}
                  className="text-slate-500 hover:underline"
                >
                  Clear
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => setShowSourceSelector(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {userMaterials.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">
                <p>You haven't uploaded any study materials yet.</p>
                {onNavigateToMaterials && (
                  <button
                    onClick={onNavigateToMaterials}
                    className="mt-2 inline-flex items-center space-x-1 text-indigo-600 font-bold hover:underline"
                  >
                    <span>Upload Syllabus & Notes Now</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 mt-2">
                {userMaterials.map((mat) => {
                  const isChecked = selectedMaterialIds.includes(mat.id);
                  return (
                    <div
                      key={mat.id}
                      onClick={() => toggleMaterial(mat.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-start space-x-2 transition ${
                        isChecked
                          ? "bg-indigo-50/80 border-indigo-200 text-indigo-950 font-medium"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div className="truncate flex-1">
                        <p className="truncate font-semibold">{mat.name}</p>
                        <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                          <span>{mat.subject}</span>
                          <span>•</span>
                          <span>{mat.type}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Study Instructions Drawer */}
        {showSettingsDrawer && (
          <div className="bg-amber-50/50 border-b border-amber-200 p-4 shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="h-4 w-4 text-amber-700" />
                <h4 className="text-xs font-bold text-amber-900">
                  Custom Study Instructions (Answer Format & Style)
                </h4>
              </div>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="p-1 text-amber-600 hover:text-amber-800 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-amber-800 mb-2 leading-relaxed">
              Tell Gemini how to format answers (e.g. 16-mark university answer with diagrams, formulas, Tanglish, or simple English).
            </p>

            {/* Preset chips */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {instructionPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSaveInstructions(preset.text)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-medium transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={studyInstructions}
                onChange={(e) => handleSaveInstructions(e.target.value)}
                placeholder="e.g. Answer as a 16-mark university exam answer with diagrams and key formulas..."
                className="flex-1 text-xs px-3 py-2 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 placeholder-slate-400"
              />
              {studyInstructions && (
                <button
                  onClick={() => handleSaveInstructions("")}
                  className="text-xs text-amber-700 hover:underline px-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <ErrorBanner
              message={errorMessage}
              onRetry={handleRetry}
              onDismiss={() => setErrorMessage("")}
            />
          )}

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                StudyVault Grounded AI Tutor
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Ask questions to break down theories, solve problems, or prepare university exam answers from your uploaded study materials.
              </p>

              <div className="grid grid-cols-1 gap-2 w-full text-left">
                {samplePrompts.map((p, i) => (
                  <button
                    key={i}
                    id={`sample-prompt-${i}`}
                    onClick={() => handleSendMessage(p)}
                    className="p-3 rounded-xl border border-slate-200 text-xs text-slate-700 hover:border-indigo-300 hover:bg-slate-50 transition flex items-center justify-between group"
                  >
                    <span>{p}</span>
                    <StudySessionIcon size={14} className="text-slate-400 group-hover:text-indigo-600 ml-2 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === "user";
              const currentView = activeViewMode[m.id] || (m.answerFormat === "handwritten" ? "handwritten" : "text");

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-2`}
                >
                  <div className={`flex items-start ${isUser ? "flex-row-reverse" : "flex-row"} max-w-[90%]`}>
                    {/* Avatar Badge */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isUser
                          ? "bg-slate-100 text-slate-700 ml-3"
                          : "bg-indigo-600 text-white mr-3 shadow-xs"
                      }`}
                    >
                      {isUser
                        ? user?.displayName
                          ? user.displayName.slice(0, 2).toUpperCase()
                          : "JD"
                        : "AI"}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-xs ${
                        isUser
                          ? "bg-slate-50 text-slate-800 border border-slate-200/80"
                          : "bg-white border border-slate-200 text-slate-900 w-full"
                      }`}
                    >
                      {/* Assistant Header: Model + Grounding Mode + View Mode Switcher */}
                      {!isUser && (
                        <div className="flex flex-wrap items-center justify-between pb-2 mb-3 border-b border-slate-100 text-xs gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-indigo-600 text-xs">
                              {m.sourceMode === "materials_only"
                                ? "Strict Study Materials Only"
                                : m.sourceMode === "materials_plus_gemini"
                                ? "Grounded in Materials + Gemini"
                                : "Gemini AI Tutor"}
                            </span>
                          </div>

                          {/* Toggle between Text View and Handwritten Notebook View */}
                          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                            <button
                              onClick={() =>
                                setActiveViewMode((prev) => ({ ...prev, [m.id]: "text" }))
                              }
                              className={`px-2 py-0.5 rounded font-medium transition ${
                                currentView === "text"
                                  ? "bg-white text-slate-900 shadow-xs font-bold"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Text View
                            </button>
                            <button
                              onClick={() =>
                                setActiveViewMode((prev) => ({ ...prev, [m.id]: "handwritten" }))
                              }
                              className={`px-2 py-0.5 rounded font-medium transition flex items-center space-x-1 ${
                                currentView === "handwritten"
                                  ? "bg-indigo-600 text-white shadow-xs font-bold"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              <PenTool className="h-3 w-3" />
                              <span>Notebook Sheet</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Content rendering */}
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{m.text}</p>
                      ) : currentView === "handwritten" ? (
                        <HandwrittenPageRenderer
                          content={m.text}
                          subject={subject}
                          title={chats.find((c) => c.id === currentChatId)?.title || "Study Answer"}
                          sourceCitations={m.referencedSources?.map((s) => `${s.materialName} (p.${s.pageNumber || 1})`)}
                        />
                      ) : (
                        <ChatMarkdownRenderer content={m.text} />
                      )}

                      {/* Grounded Source Citations Pill Footer */}
                      {!isUser && m.referencedSources && m.referencedSources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                            <Bookmark className="h-3 w-3 text-indigo-600" />
                            <span>Referenced Study Sources ({m.referencedSources.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {m.referencedSources.map((src, sIdx) => (
                              <div
                                key={sIdx}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs flex items-center space-x-1"
                                title={src.excerpt ? `Excerpt: ${src.excerpt}` : src.materialName}
                              >
                                <FileText className="h-3 w-3 text-indigo-600" />
                                <span className="font-semibold">{src.materialName}</span>
                                {src.pageNumber && (
                                  <span className="text-indigo-500 text-[10px]">p.{src.pageNumber}</span>
                                )}
                                {src.section && (
                                  <span className="text-slate-400 text-[10px]">({src.section})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold mr-3 shrink-0 animate-pulse">
                AI
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 text-xs text-indigo-900 flex items-center space-x-2">
                <RefreshIcon size={14} className="animate-spin text-indigo-600" />
                <span>
                  {sourceMode === "materials_only"
                    ? "Retrieving and verifying selected study materials..."
                    : "Gemini is generating your grounded study explanation..."}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative"
          >
            <input
              id="chat-message-input"
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={
                sourceMode === "materials_only"
                  ? `Ask strictly about your ${selectedMaterialsCount} selected study materials...`
                  : "Ask Gemini about your studies or exam preparation..."
              }
              disabled={loading}
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white placeholder-slate-400 transition"
            />
            <button
              id="chat-send-button"
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-40 transition shadow-xs"
            >
              <SendIcon size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
