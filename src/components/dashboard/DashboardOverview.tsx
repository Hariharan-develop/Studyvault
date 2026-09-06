import React, { useState, useEffect, useMemo } from "react";
import { FolderOpen } from "lucide-react";
import {
  BarChartIcon,
  ChatIcon,
  NotesIcon,
  CalendarIcon,
  ReflectionBookIcon,
  ClockIcon,
  TargetIcon,
  LightbulbIcon,
  TrendingUpIcon,
  RefreshIcon,
  ChevronDownIcon,
  CheckboxCheckedIcon,
  CheckboxEmptyIcon,
  SubjectsIcon,
} from "../icons/AppIcons";
import { ActiveTab, ChatSession, SmartNote, StudyPlan, DailyReflection, StudyMaterial } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { StudentHeroGraphic } from "./StudentHeroGraphic";
import {
  fetchUserChats,
  fetchUserNotes,
  fetchUserStudyPlans,
  fetchUserReflections,
  fetchUserStudyMaterials,
  saveUserStudyPlan,
  getUserFriendlyErrorMessage
} from "../../lib/firestore-helpers";
import { ErrorBanner } from "../ErrorBanner";

interface DashboardOverviewProps {
  onNavigate: (tab: ActiveTab) => void;
}

/**
 * Robust timestamp parser supporting Firestore Timestamps, ISO strings, and milliseconds
 */
function parseTimestamp(val: any): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val.toDate === "function") {
    try {
      return val.toDate().getTime();
    } catch {
      return 0;
    }
  }
  if (typeof val.seconds === "number") return val.seconds * 1000;
  if (typeof val === "string") {
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Clean relative time formatter for real timestamps
 */
function formatRelativeTime(ts: number): string {
  if (!ts) return "Recently";
  const diffMs = Date.now() - ts;
  if (diffMs < 0) return "Just now";
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [notes, setNotes] = useState<SmartNote[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // AI study tips list with rotator
  const studyTips = [
    "Break your study sessions into 25-minute focused blocks with 5-minute breaks. It improves concentration and long-term retention.",
    "Practice Active Recall by testing yourself before re-reading notes. The effort to retrieve memory strengthens neural connections.",
    "Use the Feynman Technique: Explain complex concepts in simple terms as if teaching a beginner to expose hidden knowledge gaps.",
    "Space out your revisions over increasing intervals (1 day, 3 days, 1 week) to combat the Ebbinghaus forgetting curve.",
    "Interleave subjects: Alternating between problem types and topics improves problem-solving agility more than blocked practice.",
  ];
  const [tipIndex, setTipIndex] = useState(0);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning,";
    if (hour < 17) return "Good Afternoon,";
    return "Good Evening,";
  };

  const displayName = user?.displayName || (user?.email ? user.email.split("@")[0] : "Student");

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMessage("");
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
      console.error("Dashboard metrics error:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Failed to load dashboard metrics from Firestore."));
    } finally {
      setLoading(false);
    }
  };

  const cycleTip = () => {
    setTipIndex(prev => (prev + 1) % studyTips.length);
  };

  // ---------------------------------------------------------------------------
  // 1. REAL METRIC CALCULATIONS
  // ---------------------------------------------------------------------------
  const studySessionsCount = chats.length;
  const materialsCount = materials.length;
  const notesCount = notes.length;
  const reflectionsCount = reflections.length;

  const { totalPlanTasks, completedPlanTasks, tasksPercent, tasksDisplay } = useMemo(() => {
    const total = plans.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
    const completed = plans.reduce(
      (sum, p) => sum + (p.tasks?.filter(t => t.completed).length || 0),
      0
    );
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      totalPlanTasks: total,
      completedPlanTasks: completed,
      tasksPercent: percent,
      tasksDisplay: total > 0 ? `${completed} / ${total}` : "0 / 0",
    };
  }, [plans]);

  // ---------------------------------------------------------------------------
  // 2. REAL TODAY'S FOCUS TASKS (Derived from User Study Plans)
  // ---------------------------------------------------------------------------
  const focusTasksList = useMemo(() => {
    interface FocusTaskEntry {
      planId: string;
      taskId: string;
      text: string;
      subject: string;
      completed: boolean;
    }
    const list: FocusTaskEntry[] = [];
    plans.forEach(plan => {
      (plan.tasks || []).forEach(task => {
        list.push({
          planId: plan.id,
          taskId: task.id,
          text: task.topic || task.guidance || `Study ${task.subject}`,
          subject: task.subject,
          completed: !!task.completed,
        });
      });
    });
    // Incomplete tasks first, then completed, take up to 4
    list.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
    return list.slice(0, 4);
  }, [plans]);

  const handleToggleFocusTask = async (planId: string, taskId: string) => {
    if (!user) return;
    const targetPlan = plans.find(p => p.id === planId);
    if (!targetPlan) return;

    const updatedTasks = targetPlan.tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const updatedPlan: StudyPlan = {
      ...targetPlan,
      tasks: updatedTasks,
    };

    // Optimistic UI update
    setPlans(prev => prev.map(p => (p.id === planId ? updatedPlan : p)));

    try {
      await saveUserStudyPlan(user.uid, updatedPlan);
    } catch (err: any) {
      console.error("Failed to sync task toggle in Firestore:", err);
      // Revert if error
      setPlans(prev => prev.map(p => (p.id === planId ? targetPlan : p)));
    }
  };

  // ---------------------------------------------------------------------------
  // 3. REAL WEEKLY STUDY ACTIVITY (Current Week Mon-Sun)
  // ---------------------------------------------------------------------------
  const weeklyActivityData = useMemo(() => {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
    const distToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distToMonday);
    monday.setHours(0, 0, 0, 0);

    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const days = dayNames.map((name, index) => {
      const dayStart = new Date(monday);
      dayStart.setDate(monday.getDate() + index);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      return {
        day: name,
        start: dayStart.getTime(),
        end: dayEnd.getTime(),
        count: 0,
      };
    });

    const recordTimestamp = (ts: number) => {
      if (!ts) return;
      for (const d of days) {
        if (ts >= d.start && ts <= d.end) {
          d.count += 1;
          break;
        }
      }
    };

    chats.forEach(c => recordTimestamp(parseTimestamp(c.updatedAt || c.createdAt)));
    notes.forEach(n => recordTimestamp(parseTimestamp(n.createdAt)));
    materials.forEach(m => recordTimestamp(parseTimestamp(m.updatedAt || m.createdAt)));
    plans.forEach(p => recordTimestamp(parseTimestamp(p.createdAt)));
    reflections.forEach(r => recordTimestamp(parseTimestamp(r.createdAt)));

    const totalCount = days.reduce((sum, d) => sum + d.count, 0);
    const maxCount = Math.max(...days.map(d => d.count), 1);

    return {
      days: days.map(d => ({
        day: d.day,
        count: d.count,
        hours: d.count > 0 ? `${(d.count * 0.5).toFixed(1)}h` : "0h",
        heightPercent: d.count === 0 ? 5 : Math.min(100, Math.round((d.count / maxCount) * 85) + 15),
      })),
      totalCount,
      totalHours: `${(totalCount * 0.5).toFixed(1)}h`,
    };
  }, [chats, notes, materials, plans, reflections]);

  // ---------------------------------------------------------------------------
  // 4. REAL SUBJECTS OVERVIEW DONUT CHART
  // ---------------------------------------------------------------------------
  const subjectsData = useMemo(() => {
    const counts: Record<string, number> = {};

    notes.forEach(n => {
      if (n.subject?.trim()) {
        const s = n.subject.trim();
        counts[s] = (counts[s] || 0) + 1;
      }
    });

    materials.forEach(m => {
      if (m.subject?.trim()) {
        const s = m.subject.trim();
        counts[s] = (counts[s] || 0) + 1;
      }
    });

    chats.forEach(c => {
      if (c.subject?.trim()) {
        const s = c.subject.trim();
        counts[s] = (counts[s] || 0) + 1;
      }
    });

    plans.forEach(p => {
      if (Array.isArray(p.subjects)) {
        p.subjects.forEach(s => {
          if (s?.trim()) {
            counts[s.trim()] = (counts[s.trim()] || 0) + 1;
          }
        });
      }
      (p.tasks || []).forEach(t => {
        if (t.subject?.trim()) {
          counts[t.subject.trim()] = (counts[t.subject.trim()] || 0) + 1;
        }
      });
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const totalEntries = entries.reduce((sum, e) => sum + e[1], 0);

    if (totalEntries === 0) {
      return { list: [], totalEntries: 0, uniqueCount: 0 };
    }

    const palette = [
      { bg: "bg-indigo-500", stroke: "#6366F1" },
      { bg: "bg-sky-400", stroke: "#38BDF8" },
      { bg: "bg-emerald-500", stroke: "#10B981" },
      { bg: "bg-amber-500", stroke: "#F59E0B" },
      { bg: "bg-purple-500", stroke: "#A855F7" },
    ];

    const top4 = entries.slice(0, 4);
    const remaining = entries.slice(4);
    const otherCount = remaining.reduce((sum, e) => sum + e[1], 0);

    const finalItems = top4.map(([name, count], idx) => {
      const percent = Math.round((count / totalEntries) * 100);
      return {
        name,
        count,
        percent,
        color: palette[idx % palette.length].bg,
        stroke: palette[idx % palette.length].stroke,
      };
    });

    if (otherCount > 0) {
      const otherPercent = Math.max(1, Math.round((otherCount / totalEntries) * 100));
      finalItems.push({
        name: "Other",
        count: otherCount,
        percent: otherPercent,
        color: palette[4].bg,
        stroke: palette[4].stroke,
      });
    }

    let cumulative = 0;
    const segments = finalItems.map(item => {
      const seg = {
        ...item,
        strokeDasharray: `${item.percent}, 100`,
        strokeDashoffset: -cumulative,
      };
      cumulative += item.percent;
      return seg;
    });

    return {
      list: segments,
      totalEntries,
      uniqueCount: entries.length,
    };
  }, [notes, materials, chats, plans]);

  // ---------------------------------------------------------------------------
  // 5. REAL RECENT ACTIVITY (Aggregated & Sorted by Timestamp)
  // ---------------------------------------------------------------------------
  const recentActivities = useMemo(() => {
    interface UnifiedActivity {
      id: string;
      type: "chat" | "note" | "material" | "plan" | "reflection";
      title: string;
      badgeText: string;
      timestamp: number;
      tab: ActiveTab;
      iconBg: string;
      iconColor: string;
    }

    const items: UnifiedActivity[] = [];

    chats.forEach(c => {
      items.push({
        id: `chat-${c.id}`,
        type: "chat",
        title: c.title || "Study Session",
        badgeText: "Chat",
        timestamp: parseTimestamp(c.updatedAt || c.createdAt),
        tab: "chat",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
      });
    });

    notes.forEach(n => {
      items.push({
        id: `note-${n.id}`,
        type: "note",
        title: n.topic || n.subject || "Smart Note",
        badgeText: n.subject || "Note",
        timestamp: parseTimestamp(n.createdAt),
        tab: "notes",
        iconBg: "bg-rose-50",
        iconColor: "text-rose-500",
      });
    });

    materials.forEach(m => {
      items.push({
        id: `material-${m.id}`,
        type: "material",
        title: m.name || "Study Material",
        badgeText: m.type?.toUpperCase() || "PDF",
        timestamp: parseTimestamp(m.updatedAt || m.createdAt),
        tab: "materials",
        iconBg: "bg-indigo-50",
        iconColor: "text-indigo-600",
      });
    });

    plans.forEach(p => {
      items.push({
        id: `plan-${p.id}`,
        type: "plan",
        title: p.examName || "Study Plan",
        badgeText: `${p.tasks?.length || 0} tasks`,
        timestamp: parseTimestamp(p.updatedAt || p.createdAt),
        tab: "planner",
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
      });
    });

    reflections.forEach(r => {
      items.push({
        id: `ref-${r.id}`,
        type: "reflection",
        title: r.keyTakeaway || (r.learnedContent ? r.learnedContent.substring(0, 35) + "..." : "Daily Reflection"),
        badgeText: "Reflection",
        timestamp: parseTimestamp(r.createdAt),
        tab: "reflection",
        iconBg: "bg-purple-50",
        iconColor: "text-purple-600",
      });
    });

    items.sort((a, b) => b.timestamp - a.timestamp);
    return items.slice(0, 5);
  }, [chats, notes, materials, plans, reflections]);

  // ---------------------------------------------------------------------------
  // 6. REAL UPCOMING DEADLINES (From Study Plans & Exams)
  // ---------------------------------------------------------------------------
  const upcomingDeadlines = useMemo(() => {
    interface DeadlineEntry {
      id: string;
      title: string;
      displayDate: string;
      daysLeftText: string;
      isOverdue: boolean;
      isSoon: boolean;
    }

    const entries: DeadlineEntry[] = [];
    const now = Date.now();

    plans.forEach(p => {
      if (p.examDate) {
        const examTime = new Date(p.examDate).getTime();
        if (!isNaN(examTime)) {
          const diffDays = Math.ceil((examTime - now) / (1000 * 60 * 60 * 24));
          const dateObj = new Date(p.examDate);
          const displayDate = isNaN(dateObj.getTime())
            ? p.examDate
            : dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

          let daysLeftText = "";
          let isOverdue = false;
          let isSoon = false;

          if (diffDays < 0) {
            daysLeftText = `${Math.abs(diffDays)}d ago`;
            isOverdue = true;
          } else if (diffDays === 0) {
            daysLeftText = "Today";
            isSoon = true;
          } else if (diffDays === 1) {
            daysLeftText = "Tomorrow";
            isSoon = true;
          } else {
            daysLeftText = `${diffDays} days left`;
            isSoon = diffDays <= 7;
          }

          entries.push({
            id: `plan-deadline-${p.id}`,
            title: p.examName,
            displayDate,
            daysLeftText,
            isOverdue,
            isSoon,
          });
        }
      }
    });

    return entries.slice(0, 4);
  }, [plans]);

  // ---------------------------------------------------------------------------
  // 7. REAL SUBJECT PROGRESS (Calculated from Study Plan Tasks)
  // ---------------------------------------------------------------------------
  const subjectsProgress = useMemo(() => {
    const taskCounts: Record<string, { total: number; completed: number }> = {};

    plans.forEach(p => {
      (p.tasks || []).forEach(t => {
        const s = t.subject?.trim() || "General";
        if (!taskCounts[s]) {
          taskCounts[s] = { total: 0, completed: 0 };
        }
        taskCounts[s].total += 1;
        if (t.completed) {
          taskCounts[s].completed += 1;
        }
      });
    });

    const entries = Object.entries(taskCounts);
    if (entries.length === 0) return [];

    const colors = ["bg-indigo-500", "bg-sky-400", "bg-emerald-400", "bg-amber-400", "bg-purple-400"];

    return entries.map(([name, data], idx) => ({
      name,
      completed: data.completed,
      total: data.total,
      percent: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      color: colors[idx % colors.length],
    })).slice(0, 4);
  }, [plans]);

  const todayFormattedDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  return (
    <div className="space-y-4 pb-10 w-full max-w-none min-w-0">
      {errorMessage && (
        <ErrorBanner
          message={errorMessage}
          onRetry={loadDashboardData}
          onDismiss={() => setErrorMessage("")}
        />
      )}

      {/* Row 1: Hero Banner + Today's Focus Card */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] gap-4 items-stretch min-w-0 w-full">
        {/* Welcome Hero Banner */}
        <div
          id="dashboard-hero-banner"
          className="min-w-0 bg-gradient-to-r from-[#edf1ff] via-[#e9eeff] to-[#e1f0fe] rounded-3xl p-5 sm:p-7 border border-[#d6e0ff] shadow-xs relative overflow-hidden flex flex-col justify-center"
        >
          {/* Ambient soft glow circles */}
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-sky-300/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 min-w-0">
            {/* Left Column: Greeting & Subtitle */}
            <div className="min-w-0 flex-1 text-center md:text-left break-words">
              <span className="text-slate-600 text-sm sm:text-base font-medium block break-words">
                {getGreeting()}
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0B1536] tracking-tight mt-1 flex flex-wrap items-center justify-center md:justify-start gap-2 break-words">
                <span className="break-words">{displayName}</span>
                <span className="inline-block animate-bounce shrink-0 text-2xl sm:text-3xl">👋</span>
              </h1>
              <div className="mt-2.5 space-y-0.5 text-slate-600 text-xs sm:text-sm font-normal leading-relaxed break-words max-w-md mx-auto md:mx-0">
                <p className="break-words">Small steps every day lead to big results.</p>
                <p className="break-words">Keep learning, keep growing!</p>
              </div>
            </div>

            {/* Center Column: 3D Cute Student Illustration */}
            <div className="flex items-center justify-center shrink-0">
              <StudentHeroGraphic className="w-36 h-36 sm:w-40 sm:h-40 lg:w-44 lg:h-44 shrink-0" />
            </div>

            {/* Right Column: Motivational Quote & Underline Bar */}
            <div className="flex flex-col items-center md:items-end justify-center text-center md:text-right shrink-0 min-w-0">
              <p className="text-base sm:text-lg lg:text-xl font-bold text-[#0B1536] tracking-tight leading-snug break-words whitespace-normal">
                “A better you<br />
                is a smarter you.”
              </p>
              <div className="w-12 h-1 bg-[#6366F1] rounded-full mt-2.5 mx-auto md:mr-0"></div>
            </div>
          </div>
        </div>

        {/* Today's Focus Card (Real Data from Study Plans) */}
        <div className="min-w-0 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3.5 mb-3.5 gap-2 min-w-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                  <TargetIcon size={18} className="text-rose-500" />
                </div>
                <h2 className="text-base font-bold text-slate-900 truncate">Today's Focus</h2>
              </div>
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap shrink-0">
                {todayFormattedDate}
              </span>
            </div>

            {/* Real checklist items or authentic empty state */}
            {focusTasksList.length > 0 ? (
              <div className="space-y-2.5 min-w-0">
                {focusTasksList.map(task => (
                  <div
                    key={`${task.planId}-${task.taskId}`}
                    onClick={() => handleToggleFocusTask(task.planId, task.taskId)}
                    className={`flex items-start space-x-3 p-1.5 rounded-xl transition cursor-pointer hover:bg-slate-50 min-w-0 ${
                      task.completed ? "opacity-80" : ""
                    }`}
                  >
                    {task.completed ? (
                      <CheckboxCheckedIcon size={20} className="text-indigo-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckboxEmptyIcon size={20} className="text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-xs sm:text-sm font-medium leading-snug break-words min-w-0 flex-1 ${
                        task.completed
                          ? "text-slate-400 line-through"
                          : "text-slate-700"
                      }`}
                      style={{ overflowWrap: "anywhere" }}
                    >
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-700">No focus tasks scheduled</p>
                <p className="text-2xs text-slate-500 mt-1 max-w-xs">
                  Create an AI Study Plan to automatically generate and track your daily study checklist.
                </p>
                <button
                  onClick={() => onNavigate("planner")}
                  className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Create Study Plan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: 5 Metric Stat Cards (100% Real Firestore Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 min-w-0 w-full">
        {/* Metric 1: Study Sessions */}
        <div
          onClick={() => onNavigate("chat")}
          className="min-w-0 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shrink-0">
              <ChatIcon size={20} className="text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight break-words">
              {studySessionsCount}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-0.5 break-words">Study Sessions</p>
          </div>
          <p className="text-xs font-semibold text-indigo-600 mt-2 flex flex-wrap items-center gap-1 min-w-0">
            <span>{studySessionsCount > 0 ? `${studySessionsCount} recorded` : "Start your first chat"}</span>
          </p>
        </div>

        {/* Metric 2: Study Materials */}
        <div
          onClick={() => onNavigate("materials")}
          className="min-w-0 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 shrink-0">
              <FolderOpen size={20} className="text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight break-words">
              {materialsCount}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-0.5 break-words">Study Materials</p>
          </div>
          <p className="text-xs font-semibold text-indigo-600 mt-2 flex flex-wrap items-center gap-1 min-w-0">
            <span>{materialsCount > 0 ? `${materialsCount} indexed` : "Upload your first file"}</span>
          </p>
        </div>

        {/* Metric 3: Notes Created */}
        <div
          onClick={() => onNavigate("notes")}
          className="min-w-0 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shrink-0">
              <NotesIcon size={20} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight break-words">
              {notesCount}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-0.5 break-words">Notes Created</p>
          </div>
          <p className="text-xs font-semibold text-emerald-600 mt-2 flex flex-wrap items-center gap-1 min-w-0">
            <span>{notesCount > 0 ? `${notesCount} in vault` : "Create your first note"}</span>
          </p>
        </div>

        {/* Metric 4: Study Tasks Done */}
        <div
          onClick={() => onNavigate("planner")}
          className="min-w-0 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 shrink-0">
              <CalendarIcon size={20} className="text-amber-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight break-words">
              {tasksDisplay}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-0.5 break-words">Study Tasks Done</p>
          </div>
          <div className="mt-2 space-y-1 min-w-0">
            <div className="flex justify-between text-2xs text-slate-500 font-medium">
              <span>{tasksPercent}% complete</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${tasksPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Metric 5: Daily Reflections */}
        <div
          onClick={() => onNavigate("reflection")}
          className="min-w-0 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 shrink-0">
              <ReflectionBookIcon size={20} className="text-purple-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight break-words">
              {reflectionsCount}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-0.5 break-words">Daily Reflections</p>
          </div>
          <p className="text-xs font-semibold text-purple-600 mt-2 flex flex-wrap items-center gap-1 min-w-0">
            <span>{reflectionsCount > 0 ? `${reflectionsCount} logged` : "Record today's log"}</span>
          </p>
        </div>
      </div>

      {/* Row 3: 3 Cards (Weekly Study Activity, Subjects Overview, Recent Activity) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.15fr_1fr_1fr] gap-4 min-w-0 w-full">
        {/* Card 1: Weekly Study Activity Bar Chart (Real Timestamp Calculations) */}
        <div className="min-w-0 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <BarChartIcon size={20} className="text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">Weekly Study Activity</h3>
              </div>
              <div className="flex items-center space-x-1 text-xs font-semibold text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                <span>{weeklyActivityData.totalHours} total</span>
              </div>
            </div>

            {/* Custom Bar Chart Canvas */}
            <div className="relative pt-4 pb-2">
              {/* Y-axis gridlines */}
              <div className="space-y-6 text-2xs text-slate-400 font-medium">
                <div className="flex items-center space-x-3">
                  <span className="w-4 text-right">4h</span>
                  <div className="flex-1 border-b border-dashed border-slate-100"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-4 text-right">3h</span>
                  <div className="flex-1 border-b border-dashed border-slate-100"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-4 text-right">2h</span>
                  <div className="flex-1 border-b border-dashed border-slate-100"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-4 text-right">1h</span>
                  <div className="flex-1 border-b border-dashed border-slate-100"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-4 text-right">0</span>
                  <div className="flex-1 border-b border-slate-200"></div>
                </div>
              </div>

              {/* Bar columns with Real Data */}
              <div className="absolute inset-x-8 bottom-2 top-4 flex items-end justify-between px-2">
                {weeklyActivityData.days.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-800 text-white text-2xs px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-20 pointer-events-none">
                      {item.hours} ({item.count} {item.count === 1 ? "activity" : "activities"})
                    </div>
                    {/* Bar */}
                    <div
                      className={`w-4 sm:w-5 rounded-t-md transition-all duration-300 shadow-2xs ${
                        item.count > 0
                          ? "bg-indigo-500 hover:bg-indigo-600"
                          : "bg-slate-200/80 hover:bg-slate-300"
                      }`}
                      style={{ height: `${item.heightPercent}%` }}
                    ></div>
                    <span className="text-2xs font-semibold text-slate-500 mt-2">
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Subjects Overview Donut Chart (Real Subject Breakdown) */}
        <div className="min-w-0 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-6">
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <SubjectsIcon size={16} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-base text-slate-900 truncate">Subjects Overview</h3>
            </div>

            {subjectsData.list.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-around gap-4 sm:gap-6 py-2">
                {/* Donut Chart with Center Text */}
                <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                    {/* Background Circle */}
                    <path
                      className="text-slate-100"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Dynamic Real Segments */}
                    {subjectsData.list.map((item, idx) => (
                      <path
                        key={idx}
                        stroke={item.stroke}
                        strokeWidth="4"
                        strokeDasharray={item.strokeDasharray}
                        strokeDashoffset={item.strokeDashoffset}
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    ))}
                  </svg>

                  {/* Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-extrabold text-slate-900 leading-none">
                      {subjectsData.uniqueCount}
                    </span>
                    <span className="text-2xs text-slate-400 font-semibold mt-0.5">
                      {subjectsData.uniqueCount === 1 ? "Subject" : "Subjects"}
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2 text-xs min-w-0 flex-1">
                  {subjectsData.list.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`}></span>
                        <span className="text-slate-600 font-medium break-words min-w-0" style={{ overflowWrap: "anywhere" }}>
                          {item.name}
                        </span>
                      </div>
                      <span className="font-bold text-slate-800 shrink-0">{item.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-700">No subjects logged yet</p>
                <p className="text-2xs text-slate-500 mt-1 max-w-xs">
                  Create notes, quizzes, or a study plan with your course subjects to see your subject breakdown.
                </p>
                <button
                  onClick={() => onNavigate("notes")}
                  className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Create Smart Note
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Recent Activity (Real User Content from Firestore) */}
        <div className="min-w-0 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between md:col-span-2 xl:col-span-1 overflow-hidden">
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-4 min-w-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <ClockIcon size={20} className="text-slate-700 shrink-0" />
                <h3 className="font-bold text-base text-slate-900 truncate">Recent Activity</h3>
              </div>
              <button
                onClick={() => onNavigate("vault")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition shrink-0 whitespace-nowrap ml-2"
              >
                View Vault
              </button>
            </div>

            {recentActivities.length > 0 ? (
              <div className="space-y-2.5 min-w-0">
                {recentActivities.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate(item.tab)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer min-w-0 gap-2"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-lg ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}>
                        {item.type === "chat" && <ChatIcon size={16} className={item.iconColor} />}
                        {item.type === "note" && <NotesIcon size={16} className={item.iconColor} />}
                        {item.type === "material" && <FolderOpen size={16} className={item.iconColor} />}
                        {item.type === "plan" && <CalendarIcon size={16} className={item.iconColor} />}
                        {item.type === "reflection" && <ReflectionBookIcon size={16} className={item.iconColor} />}
                      </div>
                      <p
                        className="text-xs font-semibold text-slate-800 break-words line-clamp-2 min-w-0 flex-1"
                        style={{ overflowWrap: "anywhere" }}
                      >
                        {item.title}
                      </p>
                    </div>
                    <span className="text-2xs text-slate-400 font-medium whitespace-nowrap shrink-0 ml-1">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-700">No recent activity found</p>
                <p className="text-2xs text-slate-500 mt-1 max-w-xs">
                  Your chat sessions, notes, quizzes, and reflections will appear here in real time.
                </p>
                <button
                  onClick={() => onNavigate("chat")}
                  className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Start a Study Session
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: 3 Cards (Upcoming Deadlines, AI Study Tip, Your Progress) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0 w-full">
        {/* Card 1: Upcoming Deadlines (Real Dates from User Study Plans) */}
        <div className="min-w-0 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-4 min-w-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <CalendarIcon size={20} className="text-rose-500 shrink-0" />
                <h3 className="font-bold text-base text-slate-900 truncate">Upcoming Deadlines</h3>
              </div>
              <button
                onClick={() => onNavigate("planner")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition shrink-0 whitespace-nowrap ml-2"
              >
                View All
              </button>
            </div>

            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-2.5 min-w-0">
                {upcomingDeadlines.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate("planner")}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer min-w-0 gap-2"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                        item.isOverdue ? "bg-red-50 text-red-600" : "bg-rose-50 text-rose-600"
                      }`}>
                        {item.displayDate}
                      </span>
                      <span
                        className="text-xs font-semibold text-slate-800 break-words min-w-0 flex-1"
                        style={{ overflowWrap: "anywhere" }}
                      >
                        {item.title}
                      </span>
                    </div>
                    <span className={`text-2xs font-bold whitespace-nowrap shrink-0 ml-1 ${
                      item.isOverdue ? "text-red-500" : item.isSoon ? "text-amber-500" : "text-rose-500"
                    }`}>
                      {item.daysLeftText}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-700">No deadlines scheduled</p>
                <p className="text-2xs text-slate-500 mt-1 max-w-xs">
                  Set exam or milestone target dates in your Study Planner to track them here.
                </p>
                <button
                  onClick={() => onNavigate("planner")}
                  className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Set Exam Date
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: AI Study Tip */}
        <div className="min-w-0 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-4 min-w-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <LightbulbIcon size={20} className="text-amber-500 shrink-0" />
                <h3 className="font-bold text-base text-slate-900 truncate">AI Study Tip</h3>
              </div>
              <button
                onClick={cycleTip}
                title="Generate another study tip"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition shrink-0"
              >
                <RefreshIcon size={16} className="text-slate-400 hover:text-indigo-600" />
              </button>
            </div>

            <div className="bg-amber-50/40 border border-amber-100/70 rounded-2xl p-5 my-2 min-w-0">
              <p
                className="text-sm font-medium text-slate-700 leading-relaxed italic break-words whitespace-normal"
                style={{ overflowWrap: "anywhere" }}
              >
                “{studyTips[tipIndex]}”
              </p>
              <p className="text-xs font-bold text-indigo-600 text-right mt-3 whitespace-nowrap">
                — Gemini AI
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Your Progress (Real Subject Progress from Study Plans) */}
        <div className="min-w-0 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between md:col-span-2 xl:col-span-1 overflow-hidden">
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-5 min-w-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <TrendingUpIcon size={20} className="text-indigo-600 shrink-0" />
                <h3 className="font-bold text-base text-slate-900 truncate">Your Progress</h3>
              </div>
              <button
                onClick={() => onNavigate("planner")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition shrink-0 whitespace-nowrap ml-2"
              >
                View Details
              </button>
            </div>

            {subjectsProgress.length > 0 ? (
              <div className="space-y-4 min-w-0">
                {subjectsProgress.map((prog, idx) => (
                  <div key={idx} className="space-y-1.5 min-w-0">
                    <div className="flex justify-between text-xs font-semibold gap-2 min-w-0">
                      <span
                        className="text-slate-700 break-words min-w-0 flex-1"
                        style={{ overflowWrap: "anywhere" }}
                      >
                        {prog.name}
                      </span>
                      <span className="text-slate-500 font-bold shrink-0">{prog.percent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`${prog.color} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${prog.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-700">No progress data yet</p>
                <p className="text-2xs text-slate-500 mt-1 max-w-xs">
                  Generate a study plan to track milestone completion by subject.
                </p>
                <button
                  onClick={() => onNavigate("planner")}
                  className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Create Plan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
