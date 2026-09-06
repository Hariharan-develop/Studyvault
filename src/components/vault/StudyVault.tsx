import React, { useState, useEffect } from "react";
import {
  ExternalLink,
  FolderOpen,
} from "lucide-react";
import {
  VaultIcon,
  SearchIcon,
  ChatIcon,
  NotesIcon,
  CalendarIcon,
  StudySessionIcon,
  TrashIcon,
} from "../icons/AppIcons";
import {
  ChatSession,
  SmartNote,
  StudyPlan,
  DailyReflection,
  StudyMaterial,
  ActiveTab
} from "../../types";
import { useAuth } from "../../context/AuthContext";
import {
  fetchUserChats,
  fetchUserNotes,
  fetchUserStudyPlans,
  fetchUserReflections,
  fetchUserStudyMaterials,
  deleteUserChat,
  deleteUserNote,
  deleteUserStudyPlan,
  deleteUserReflection,
  deleteUserStudyMaterial,
  getUserFriendlyErrorMessage
} from "../../lib/firestore-helpers";
import { ErrorBanner } from "../ErrorBanner";

interface StudyVaultProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const StudyVault: React.FC<StudyVaultProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [notes, setNotes] = useState<SmartNote[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);

  useEffect(() => {
    if (!user) return;
    loadAllVaultItems();
  }, [user]);

  const loadAllVaultItems = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [m, c, n, p, r] = await Promise.all([
        fetchUserStudyMaterials(user.uid),
        fetchUserChats(user.uid),
        fetchUserNotes(user.uid),
        fetchUserStudyPlans(user.uid),
        fetchUserReflections(user.uid),
      ]);
      setMaterials(m);
      setChats(c);
      setNotes(n);
      setPlans(p);
      setReflections(r);
    } catch (err: any) {
      console.error("Vault loading error:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Failed to load records from Firestore."));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (type: string, id: string) => {
    if (!user) return;
    try {
      if (type === "material") {
        await deleteUserStudyMaterial(user.uid, id);
        setMaterials(prev => prev.filter(item => item.id !== id));
      } else if (type === "chat") {
        await deleteUserChat(user.uid, id);
        setChats(prev => prev.filter(item => item.id !== id));
      } else if (type === "note") {
        await deleteUserNote(user.uid, id);
        setNotes(prev => prev.filter(item => item.id !== id));
      } else if (type === "plan") {
        await deleteUserStudyPlan(user.uid, id);
        setPlans(prev => prev.filter(item => item.id !== id));
      } else if (type === "reflection") {
        await deleteUserReflection(user.uid, id);
        setReflections(prev => prev.filter(item => item.id !== id));
      }
    } catch (err: any) {
      console.error("Vault delete error:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Could not delete record from Firestore."));
    }
  };

  // Consolidate all items for unified search/filter
  const unifiedItems = [
    ...materials.map(m => ({
      id: m.id,
      type: "material",
      typeLabel: "Study Material",
      title: m.name,
      subtitle: `${m.subject} • ${m.type} • ${m.chunks?.length || 1} indexed chunks`,
      targetTab: "materials" as ActiveTab,
      icon: FolderOpen,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    })),
    ...chats.map(c => ({
      id: c.id,
      type: "chat",
      typeLabel: "AI Chat",
      title: c.title || "Chat Session",
      subtitle: `${c.subject || "General"} • ${c.messages?.length || 0} messages`,
      targetTab: "chat" as ActiveTab,
      icon: ChatIcon,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    })),
    ...notes.map(n => ({
      id: n.id,
      type: "note",
      typeLabel: "Smart Note",
      title: n.topic || "Untitled Note",
      subtitle: `${n.subject} • ${n.summary?.slice(0, 70)}...`,
      targetTab: "notes" as ActiveTab,
      icon: NotesIcon,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    })),
    ...plans.map(p => ({
      id: p.id,
      type: "plan",
      typeLabel: "Study Plan",
      title: p.examName,
      subtitle: `Target: ${p.examDate} • ${p.tasks?.length || 0} scheduled tasks`,
      targetTab: "planner" as ActiveTab,
      icon: CalendarIcon,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    })),
    ...reflections.map(r => ({
      id: r.id,
      type: "reflection",
      typeLabel: "Reflection",
      title: `Daily Journal (${r.date})`,
      subtitle: r.learnedContent?.slice(0, 80) + "...",
      targetTab: "reflection" as ActiveTab,
      icon: StudySessionIcon,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    })),
  ];

  const filteredItems = unifiedItems.filter(item => {
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {errorMessage && (
        <ErrorBanner
          message={errorMessage}
          onRetry={loadAllVaultItems}
          onDismiss={() => setErrorMessage("")}
        />
      )}

      {/* Vault Header Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <VaultIcon size={20} className="text-indigo-600" />
              <span>Isolated Learning Vault</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely query and filter all your historical notes, dialogues, assessments, and study schedules.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <VaultIcon size={14} className="text-emerald-600" />
            <span>Encrypted at Rest</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              id="vault-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by topic, keyword, exam, or subject..."
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Items" },
              { id: "material", label: "Study Materials" },
              { id: "chat", label: "Chats" },
              { id: "note", label: "Notes" },
              { id: "plan", label: "Plans" },
              { id: "reflection", label: "Reflections" },
            ].map(f => (
              <button
                key={f.id}
                id={`vault-filter-${f.id}`}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  filterType === f.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Vault Items */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Loading your private vault records...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <VaultIcon size={40} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 mb-1">No Vault Items Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {searchTerm || filterType !== "all"
              ? "Try adjusting your search query or switching to another filter."
              : "Generate notes, start a chat, or create a study plan to begin building your vault."}
          </p>
          <button
            id="vault-start-study-btn"
            onClick={() => onNavigate("chat")}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
          >
            Start a Study Chat
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={`${item.type}-${item.id}`}
                id={`vault-card-${item.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.color}`}>
                      {item.typeLabel}
                    </span>
                    <button
                      id={`vault-delete-${item.id}`}
                      onClick={() => handleDeleteItem(item.type, item.id)}
                      className="p-1 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition"
                      title="Delete record"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>

                  <div className="flex items-start space-x-3 mb-2">
                    <div className={`p-2 rounded-xl ${item.color} flex-shrink-0 mt-0.5`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    id={`vault-open-${item.id}`}
                    onClick={() => onNavigate(item.targetTab)}
                    className="flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    <span>Open in {item.typeLabel}</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
