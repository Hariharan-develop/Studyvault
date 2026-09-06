import React, { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Save,
  Trash2,
  History,
  Calendar,
  Eye,
  Search,
  BookOpen,
  ArrowUpRight,
  Filter,
  Plus
} from "lucide-react";
import { DailyReflection } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useSubjects } from "../../context/SubjectContext";
import { SubjectSelector } from "../common/SubjectSelector";
import { analyzeDailyReflection } from "../../lib/api";
import {
  saveUserReflection,
  fetchUserReflections,
  deleteUserReflection,
  getUserFriendlyErrorMessage,
} from "../../lib/firestore-helpers";
import { ErrorBanner } from "../ErrorBanner";
import { collection, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";

const LOCAL_STORAGE_REFL_KEY = "studyvault_local_reflections_history";

export const DailyReflectionComponent: React.FC = () => {
  const { user } = useAuth();
  const { subjects: globalSubjects } = useSubjects();

  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [subject, setSubject] = useState<string>("");
  const [learnedContent, setLearnedContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<Partial<DailyReflection> | null>(null);
  const [savedReflections, setSavedReflections] = useState<DailyReflection[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");

  useEffect(() => {
    loadReflections();
  }, [user]);

  // Sync initial subject if available
  useEffect(() => {
    if (globalSubjects.length > 0 && !subject) {
      setSubject(globalSubjects[0]);
    }
  }, [globalSubjects]);

  const loadReflections = async () => {
    setLoadingHistory(true);
    let cachedList: DailyReflection[] = [];

    // Load from local storage first for instant response
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_REFL_KEY);
      if (stored) {
        cachedList = JSON.parse(stored);
        if (Array.isArray(cachedList)) {
          setSavedReflections(cachedList);
        }
      }
    } catch {
      // ignore
    }

    // Load from Firestore if user logged in
    if (user) {
      try {
        const items = await fetchUserReflections(user.uid);
        if (items && items.length > 0) {
          setSavedReflections(items);
          try {
            localStorage.setItem(LOCAL_STORAGE_REFL_KEY, JSON.stringify(items));
          } catch {
            // ignore
          }
        }
      } catch (err: any) {
        console.warn("Could not sync reflection history from Firestore, using local cache:", err);
      }
    }
    setLoadingHistory(false);
  };

  const persistReflectionList = (list: DailyReflection[]) => {
    setSavedReflections(list);
    try {
      localStorage.setItem(LOCAL_STORAGE_REFL_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  const handleAnalyze = async () => {
    if (!learnedContent.trim() || loading) return;
    setErrorMessage("");
    setLoading(true);

    try {
      const { result } = await analyzeDailyReflection(learnedContent, date);

      const reflCol = user ? collection(db, "users", user.uid, "reflections") : null;
      const generatedId = reflCol ? doc(reflCol).id : `refl_${Date.now()}`;

      const reflectionData: DailyReflection = {
        id: generatedId,
        date,
        subject: subject.trim() || undefined,
        learnedContent,
        summary: result.summary || "",
        keyTakeaway: result.keyTakeaway || "",
        areasNeedingRevision: Array.isArray(result.areasNeedingRevision)
          ? result.areasNeedingRevision
          : [],
        suggestedNextStep: result.suggestedNextStep || "",
        createdAt: Date.now(),
      };

      setAnalysisResult(reflectionData);

      // Auto-save to past history (both Firestore and local cache)
      const updatedList = [reflectionData, ...savedReflections.filter((r) => r.id !== reflectionData.id)];
      persistReflectionList(updatedList);

      if (user) {
        try {
          const saved = await saveUserReflection(user.uid, reflectionData);
          const synchronized = [saved, ...savedReflections.filter((r) => r.id !== saved.id)];
          persistReflectionList(synchronized);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        } catch (saveErr) {
          console.warn("Auto-save reflection error:", saveErr);
        }
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error("Reflection analysis error:", err);
      setErrorMessage(
        getUserFriendlyErrorMessage(err, "Failed to analyze reflection with Gemini.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    if (!analysisResult) return;
    setErrorMessage("");
    setSaving(true);

    try {
      const validId =
        analysisResult.id && analysisResult.id.trim()
          ? analysisResult.id.trim()
          : `refl_${Date.now()}`;

      const fullReflection: DailyReflection = {
        id: validId,
        date: analysisResult.date || date,
        subject: subject.trim() || analysisResult.subject,
        learnedContent: analysisResult.learnedContent || learnedContent,
        summary: analysisResult.summary || "",
        keyTakeaway: analysisResult.keyTakeaway || "",
        areasNeedingRevision: analysisResult.areasNeedingRevision || [],
        suggestedNextStep: analysisResult.suggestedNextStep || "",
        createdAt: analysisResult.createdAt || Date.now(),
      };

      const updatedList = [fullReflection, ...savedReflections.filter((r) => r.id !== fullReflection.id)];
      persistReflectionList(updatedList);
      setAnalysisResult(fullReflection);

      if (user) {
        const saved = await saveUserReflection(user.uid, fullReflection);
        const synchronized = [saved, ...savedReflections.filter((r) => r.id !== saved.id)];
        persistReflectionList(synchronized);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Save reflection error:", err);
      setErrorMessage(
        getUserFriendlyErrorMessage(
          err,
          "Failed to save reflection to Firestore. Content preserved in history."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // Quick direct save without AI analysis
  const handleQuickSaveWithoutAnalysis = async () => {
    if (!learnedContent.trim()) {
      setErrorMessage("Please enter what you studied before saving.");
      return;
    }

    const reflectionData: DailyReflection = {
      id: `refl_${Date.now()}`,
      date,
      subject: subject.trim() || undefined,
      learnedContent,
      summary: learnedContent.slice(0, 140) + (learnedContent.length > 140 ? "..." : ""),
      keyTakeaway: "Logged study session",
      areasNeedingRevision: [],
      suggestedNextStep: "Review in next revision cycle",
      createdAt: Date.now(),
    };

    const updatedList = [reflectionData, ...savedReflections.filter((r) => r.id !== reflectionData.id)];
    persistReflectionList(updatedList);
    setAnalysisResult(reflectionData);

    if (user) {
      try {
        await saveUserReflection(user.uid, reflectionData);
      } catch (err) {
        console.warn("Could not save to Firestore:", err);
      }
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const remaining = savedReflections.filter((r) => r.id !== id);
    persistReflectionList(remaining);

    if (analysisResult?.id === id) {
      setAnalysisResult(null);
    }

    if (user) {
      try {
        await deleteUserReflection(user.uid, id);
      } catch (err: any) {
        console.error("Delete reflection error:", err);
      }
    }
  };

  const handleSelectPastReflection = (reflection: DailyReflection) => {
    setAnalysisResult(reflection);
    setDate(reflection.date || new Date().toISOString().split("T")[0]);
    setSubject(reflection.subject || "");
    setLearnedContent(reflection.learnedContent || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopyAnalysis = () => {
    if (!analysisResult) return;
    const text = `Daily Study Reflection (${date}) - ${subject || "General"}
Summary: ${analysisResult.summary}
Key Takeaway: ${analysisResult.keyTakeaway}
Next Step: ${analysisResult.suggestedNextStep}
Focus Areas: ${(analysisResult.areasNeedingRevision || []).join(", ")}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setLearnedContent("");
    setAnalysisResult(null);
    setErrorMessage("");
  };

  // Filtered reflections
  const filteredReflections = savedReflections.filter((r) => {
    const matchesSubject =
      selectedSubjectFilter === "all" ||
      (r.subject && r.subject.toLowerCase() === selectedSubjectFilter.toLowerCase());

    if (!matchesSubject) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.date && r.date.toLowerCase().includes(q)) ||
      (r.subject && r.subject.toLowerCase().includes(q)) ||
      (r.learnedContent && r.learnedContent.toLowerCase().includes(q)) ||
      (r.keyTakeaway && r.keyTakeaway.toLowerCase().includes(q)) ||
      (r.summary && r.summary.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {errorMessage && (
        <ErrorBanner
          message={errorMessage}
          onRetry={analysisResult ? handleManualSave : handleAnalyze}
          onDismiss={() => setErrorMessage("")}
        />
      )}

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reflection Input Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Daily Metacognitive Journal</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Reflect on what you studied today. Gemini extracts retention anchors and saves directly into your past history.
              </p>
            </div>

            {learnedContent && (
              <button
                type="button"
                id="reset-reflection-btn"
                onClick={handleClear}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center space-x-1 cursor-pointer"
                title="Reset session"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Study Date</label>
              <input
                id="reflection-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Subject</label>
              <SubjectSelector
                id="reflection-subject-select"
                value={subject}
                onChange={setSubject}
                placeholder="Select or enter subject..."
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              What did you study today? (Concepts, insights, problems solved)
            </label>
            <textarea
              id="reflection-content-input"
              rows={7}
              value={learnedContent}
              onChange={(e) => setLearnedContent(e.target.value)}
              placeholder="e.g. Today I studied Dijkstra's algorithm. I understood the priority queue implementation and relaxation step, but felt slightly confused about how negative edge weights break the greedy choice property..."
              className="w-full text-xs px-3.5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400 resize-none leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              id="analyze-reflection-btn"
              onClick={handleAnalyze}
              disabled={loading || !learnedContent.trim()}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {loading
                  ? "Analyzing & Saving to History..."
                  : "Analyze & Save to History"}
              </span>
            </button>

            <button
              id="quick-save-reflection-btn"
              type="button"
              onClick={handleQuickSaveWithoutAnalysis}
              disabled={loading || !learnedContent.trim()}
              className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
              title="Store directly in past history without AI analysis"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Log Entry</span>
            </button>
          </div>
        </div>

        {/* Gemini Feedback & Retention Output */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Cognitive Retention Analysis</h3>
                {subject && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 mt-1 inline-block">
                    {subject}
                  </span>
                )}
              </div>
              {analysisResult && (
                <div className="flex items-center space-x-2">
                  <button
                    id="save-reflection-btn"
                    onClick={handleManualSave}
                    disabled={saving}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    title="Save or update in history"
                  >
                    <Save size={14} />
                    <span>{saving ? "Saving..." : saveSuccess ? "Saved to History ✓" : "Save to History"}</span>
                  </button>
                  <button
                    id="copy-analysis-btn"
                    onClick={handleCopyAnalysis}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                    title="Copy analysis"
                  >
                    {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                </div>
              )}
            </div>

            {analysisResult ? (
              <div className="space-y-4">
                {/* Executive Summary */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Core Learning Summary
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {analysisResult.summary}
                  </p>
                </div>

                {/* Key Retention Anchor */}
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-1.5">
                  <h4 className="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Key Retention Anchor</span>
                  </h4>
                  <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                    {analysisResult.keyTakeaway}
                  </p>
                </div>

                {/* Critical Attention Areas */}
                {analysisResult.areasNeedingRevision &&
                  analysisResult.areasNeedingRevision.length > 0 && (
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/60 space-y-2">
                      <h4 className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Concepts Requiring Active Revision</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {analysisResult.areasNeedingRevision.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-amber-950 flex items-start space-x-2 leading-relaxed"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Suggested Next Step */}
                {analysisResult.suggestedNextStep && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Recommended Next Action
                    </span>
                    <p className="text-xs text-slate-800 font-medium">
                      {analysisResult.suggestedNextStep}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No Reflection Loaded</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Type what you learned and click Analyze, or select any past reflection from your history archive below.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Powered by Gemini 3.6 Flash</span>
            <span>Auto-synced to Cloud History</span>
          </div>
        </div>
      </div>

      {/* PAST REFLECTIONS HISTORY SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Stored Past Reflections History</span>
                <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-indigo-100">
                  {savedReflections.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Your past study logs and cognitive reflections stored securely across sessions
              </p>
            </div>
          </div>

          {/* Search & Subject Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {globalSubjects.length > 0 && (
              <select
                id="filter-reflection-subject"
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
              >
                <option value="all">All Subjects</option>
                {globalSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                id="search-reflection-history"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        {loadingHistory ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading past reflections history...</span>
          </div>
        ) : filteredReflections.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 mb-1">
              {searchQuery || selectedSubjectFilter !== "all"
                ? "No matching reflections found"
                : "No past reflections recorded yet"}
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              {searchQuery || selectedSubjectFilter !== "all"
                ? "Try searching with a different keyword or resetting filters."
                : "Submit your daily study reflection above to store your past learning history."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReflections.map((refl) => {
              const isSelected = analysisResult?.id === refl.id;
              return (
                <div
                  key={refl.id}
                  id={`reflection-card-${refl.id}`}
                  onClick={() => handleSelectPastReflection(refl)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between group text-left ${
                    isSelected
                      ? "bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                      : "bg-slate-50/50 border-slate-200/90 hover:bg-white hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1 border-b border-slate-200/60">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-indigo-700 flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{refl.date}</span>
                        </span>
                        {refl.subject && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100/70 text-indigo-800">
                            {refl.subject}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          id={`view-refl-btn-${refl.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPastReflection(refl);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                          title="View and load reflection"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-refl-btn-${refl.id}`}
                          onClick={(e) => handleDelete(refl.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          title="Delete reflection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 line-clamp-2 break-words">
                        {refl.learnedContent}
                      </p>
                      {refl.keyTakeaway && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 italic break-words">
                          <span className="font-semibold not-italic text-slate-700">Anchor: </span>
                          {refl.keyTakeaway}
                        </p>
                      )}
                    </div>

                    {refl.areasNeedingRevision && refl.areasNeedingRevision.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {refl.areasNeedingRevision.slice(0, 2).map((area, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded truncate max-w-[150px]"
                            title={area}
                          >
                            {area}
                          </span>
                        ))}
                        {refl.areasNeedingRevision.length > 2 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{refl.areasNeedingRevision.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-indigo-600 font-semibold group-hover:underline flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{isSelected ? "Currently Viewing" : "Load Details"}</span>
                    </span>
                    {refl.suggestedNextStep && (
                      <span className="text-slate-400 truncate max-w-[140px] text-[10px]" title={refl.suggestedNextStep}>
                        Next: {refl.suggestedNextStep}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
