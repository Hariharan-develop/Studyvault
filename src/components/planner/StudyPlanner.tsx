import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  Check,
  FileText,
  Clock,
  Pencil,
  Trash2,
  Plus,
  X,
  Calendar,
  AlertCircle,
  Settings,
  Save,
  ChevronRight,
  Bell,
  BellRing
} from "lucide-react";
import {
  CalendarIcon,
  CheckboxCheckedIcon,
  CheckboxEmptyIcon,
  PlusIcon,
  TrashIcon,
} from "../icons/AppIcons";
import { StudyPlan, StudyTask, StudyMaterial } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useSubjects } from "../../context/SubjectContext";
import { useNotifications } from "../../context/NotificationContext";
import { SubjectSelector } from "../common/SubjectSelector";
import { generateStudyPlan } from "../../lib/api";
import {
  saveUserStudyPlan,
  fetchUserStudyPlans,
  deleteUserStudyPlan,
  fetchUserStudyMaterials,
  getUserFriendlyErrorMessage
} from "../../lib/firestore-helpers";
import { ErrorBanner } from "../ErrorBanner";
import { collection, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export const COMMON_TIME_OPTIONS = [
  "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM",
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
  "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM", "12:00 AM"
];

export const SCHEDULE_PRESETS = [
  { label: "🌅 Morning", start: "08:00 AM", end: "12:00 PM", hours: 4 },
  { label: "☀️ Afternoon", start: "01:00 PM", end: "05:00 PM", hours: 4 },
  { label: "🌙 Evening", start: "06:00 PM", end: "10:00 PM", hours: 4 },
  { label: "🦉 Night Owl", start: "08:00 PM", end: "12:00 AM", hours: 4 },
  { label: "📚 Full Day", start: "09:00 AM", end: "05:00 PM", hours: 8 },
];

export const parseTimeToDecimalHours = (timeStr: string): number => {
  if (!timeStr) return 9;
  const match12 = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const mins = parseInt(match12[2], 10);
    const meridiem = match12[3].toUpperCase();
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return hours + mins / 60;
  }
  const match24 = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return parseInt(match24[1], 10) + parseInt(match24[2], 10) / 60;
  }
  return 9;
};

export const formatDecimalHoursTo12Hour = (hours: number): string => {
  const norm = ((hours % 24) + 24) % 24;
  const h = Math.floor(norm);
  const m = Math.round((norm - h) * 60);
  const meridiem = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${meridiem}`;
};

export const calculateHoursBetween = (startStr: string, endStr: string): number => {
  const start = parseTimeToDecimalHours(startStr);
  const end = parseTimeToDecimalHours(endStr);
  let diff = end - start;
  if (diff <= 0) diff += 24;
  return Math.round(diff * 10) / 10;
};

export const StudyPlanner: React.FC = () => {
  const { user } = useAuth();
  const { subjects: globalSubjects, addSubject } = useSubjects();
  const {
    permissionGranted,
    requestNotificationPermission,
    triggerManualReminderCheck,
  } = useNotifications();

  const [examName, setExamName] = useState<string>("Final Semester Exams");
  const [examDate, setExamDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [availableHours, setAvailableHours] = useState<number>(4);
  const [studyStartTime, setStudyStartTime] = useState<string>("09:00 AM");
  const [studyEndTime, setStudyEndTime] = useState<string>("01:00 PM");
  const [selectedSubjectsList, setSelectedSubjectsList] = useState<string[]>([]);
  const [subjectListInput, setSubjectListInput] = useState<string>("");
  const [topicsInput, setTopicsInput] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [savedPlans, setSavedPlans] = useState<StudyPlan[]>([]);
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Study materials integration
  const [availableMaterials, setAvailableMaterials] = useState<StudyMaterial[]>([]);
  const [includeMaterialsEnabled, setIncludeMaterialsEnabled] = useState<boolean>(true);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

  // Task Editing & Creation State
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
  const [isEditingPlanInfo, setIsEditingPlanInfo] = useState<boolean>(false);

  // Task form state (for editing or adding)
  const [taskSubject, setTaskSubject] = useState<string>("");
  const [taskTopic, setTaskTopic] = useState<string>("");
  const [taskDay, setTaskDay] = useState<number>(1);
  const [taskStartTime, setTaskStartTime] = useState<string>("09:00 AM");
  const [taskEndTime, setTaskEndTime] = useState<string>("10:30 AM");
  const [taskDuration, setTaskDuration] = useState<number>(90);
  const [taskPriority, setTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [taskIsRevision, setTaskIsRevision] = useState<boolean>(false);
  const [taskIsPractice, setTaskIsPractice] = useState<boolean>(false);
  const [taskGuidance, setTaskGuidance] = useState<string>("");

  // Plan info editing state
  const [editPlanExamName, setEditPlanExamName] = useState<string>("");
  const [editPlanExamDate, setEditPlanExamDate] = useState<string>("");
  const [editPlanHours, setEditPlanHours] = useState<number>(4);
  const [editPlanStartTime, setEditPlanStartTime] = useState<string>("09:00 AM");
  const [editPlanEndTime, setEditPlanEndTime] = useState<string>("01:00 PM");

  // Synchronize time window with available hours
  const handleStartTimeChange = (newStart: string) => {
    setStudyStartTime(newStart);
    const newHours = calculateHoursBetween(newStart, studyEndTime);
    if (newHours > 0 && newHours <= 16) {
      setAvailableHours(newHours);
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    setStudyEndTime(newEnd);
    const newHours = calculateHoursBetween(studyStartTime, newEnd);
    if (newHours > 0 && newHours <= 16) {
      setAvailableHours(newHours);
    }
  };

  const handleApplyPreset = (preset: (typeof SCHEDULE_PRESETS)[0]) => {
    setStudyStartTime(preset.start);
    setStudyEndTime(preset.end);
    setAvailableHours(preset.hours);
  };

  useEffect(() => {
    if (!user) return;
    loadPlans();
    loadMaterials();
  }, [user]);

  // Synchronize global subjects if selected list is empty
  useEffect(() => {
    if (globalSubjects.length > 0 && selectedSubjectsList.length === 0 && !subjectListInput) {
      setSelectedSubjectsList(globalSubjects.slice(0, 3));
      setSubjectListInput(globalSubjects.slice(0, 3).join(", "));
    }
  }, [globalSubjects]);

  const loadPlans = async () => {
    if (!user) return;
    try {
      const plans = await fetchUserStudyPlans(user.uid);
      setSavedPlans(plans);
      if (plans.length > 0 && !activePlan) {
        setActivePlan(plans[0]);
      }
    } catch (err: any) {
      console.error("Failed to load study plans:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Could not load study plans from Firestore."));
    }
  };

  const loadMaterials = async () => {
    if (!user) return;
    try {
      const mats = await fetchUserStudyMaterials(user.uid);
      setAvailableMaterials(mats);
      const readyIds = mats.filter(m => m.processingStatus === "ready").map(m => m.id);
      setSelectedMaterialIds(readyIds);
    } catch (err) {
      console.error("Failed to load study materials for planner:", err);
    }
  };

  const toggleMaterialSelection = (materialId: string) => {
    setSelectedMaterialIds(prev =>
      prev.includes(materialId)
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };

  const handleToggleSubject = (sub: string) => {
    let nextList: string[];
    if (selectedSubjectsList.includes(sub)) {
      nextList = selectedSubjectsList.filter(s => s !== sub);
    } else {
      nextList = [...selectedSubjectsList, sub];
    }
    setSelectedSubjectsList(nextList);
    setSubjectListInput(nextList.join(", "));
  };

  // Helper to format minutes to HH:MM AM/PM
  const formatTimeSlot = (startHour: number, durationMins: number): { start: string; end: string } => {
    const startTotal = Math.round(startHour * 60);
    const endTotal = startTotal + durationMins;

    const toTimeStr = (totalMins: number) => {
      const hrs = Math.floor(totalMins / 60) % 24;
      const mins = totalMins % 60;
      const period = hrs >= 12 ? "PM" : "AM";
      const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12;
      return `${String(displayHrs).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${period}`;
    };

    return {
      start: toTimeStr(startTotal),
      end: toTimeStr(endTotal),
    };
  };

  const handleGeneratePlan = async () => {
    if (loading || !user) return;
    setErrorMessage("");
    setLoading(true);

    try {
      // Gather subjects from both selected chips and input text
      const manualList = subjectListInput
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
      const finalSubjects = Array.from(new Set([...selectedSubjectsList, ...manualList]));

      if (finalSubjects.length === 0) {
        finalSubjects.push("General Academics");
      }

      // Extract included materials if enabled
      const includedMats = includeMaterialsEnabled && selectedMaterialIds.length > 0
        ? availableMaterials
            .filter(m => selectedMaterialIds.includes(m.id))
            .map(m => ({
              id: m.id,
              name: m.name,
              subject: m.subject,
              type: m.type,
              description: m.description,
            }))
        : undefined;

      const { plan } = await generateStudyPlan({
        examName,
        examDate,
        subjects: finalSubjects,
        availableHoursPerDay: availableHours,
        studyStartTime,
        studyEndTime,
        topicsToComplete: topicsInput,
        includedMaterials: includedMats,
      });

      const plansCol = collection(db, "users", user.uid, "studyPlans");
      const generatedId = doc(plansCol).id;

      // Group tasks by day to assign realistic sequential time slots based on user's chosen start time
      let currentDay = 1;
      let dayStartHour = parseTimeToDecimalHours(studyStartTime);

      const formattedTasks: StudyTask[] = (plan.tasks || []).map((t: any, index: number) => {
        const taskDayNum = Number(t.day) || 1;
        if (taskDayNum !== currentDay) {
          currentDay = taskDayNum;
          dayStartHour = parseTimeToDecimalHours(studyStartTime);
        }

        const duration = Number(t.durationMinutes) || 60;
        let start = t.startTime || "";
        let end = t.endTime || "";

        if (!start || !end) {
          const slot = formatTimeSlot(dayStartHour, duration);
          start = start || slot.start;
          end = end || slot.end;
          dayStartHour += (duration + 15) / 60; // 15 min rest between sessions
        }

        const slotStr = t.timeSlot || `${start} – ${end}`;

        return {
          id: t.id || `task_${index}_${Date.now()}`,
          day: taskDayNum,
          date: t.date || "",
          subject: t.subject || finalSubjects[index % finalSubjects.length] || "Study Subject",
          topic: t.topic || "Core Topic",
          durationMinutes: duration,
          startTime: start,
          endTime: end,
          timeSlot: slotStr,
          priority: t.priority || "medium",
          isRevision: Boolean(t.isRevision),
          isPractice: Boolean(t.isPractice),
          guidance: t.guidance || "",
          completed: false,
          materialId: t.materialId,
          materialName: t.materialName,
        };
      });

      const newPlan: StudyPlan = {
        id: generatedId,
        examName,
        examDate,
        availableHoursPerDay: availableHours,
        studyStartTime,
        studyEndTime,
        studyTimeWindow: `${studyStartTime} – ${studyEndTime}`,
        subjects: finalSubjects,
        planSummary: plan.planSummary || "Personalized Spaced Repetition Study Schedule",
        tasks: formattedTasks,
        includedMaterialIds: includedMats?.map(m => m.id) || [],
        includedMaterialNames: includedMats?.map(m => m.name) || [],
        createdAt: Date.now(),
      };

      const saved = await saveUserStudyPlan(user.uid, newPlan);
      setActivePlan(saved);
      setSavedPlans([saved, ...savedPlans.filter(p => p.id !== saved.id)]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Plan generation error:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Failed to generate study plan with Gemini."));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!activePlan || !user) return;

    const updatedTasks = activePlan.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    const updatedPlan: StudyPlan = {
      ...activePlan,
      tasks: updatedTasks,
    };

    setActivePlan(updatedPlan);
    setSavedPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));

    try {
      const saved = await saveUserStudyPlan(user.uid, updatedPlan);
      setActivePlan(saved);
    } catch (err: any) {
      console.error("Failed to update task completion in Firestore:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Failed to sync task progress with database."));
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!user) return;
    try {
      await deleteUserStudyPlan(user.uid, planId);
      const remaining = savedPlans.filter(p => p.id !== planId);
      setSavedPlans(remaining);
      if (activePlan?.id === planId) {
        setActivePlan(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err: any) {
      console.error("Failed to delete study plan:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Could not delete study plan from Firestore."));
    }
  };

  // Open Edit Task Modal
  const handleOpenEditTask = (task: StudyTask) => {
    setEditingTask(task);
    setTaskSubject(task.subject);
    setTaskTopic(task.topic);
    setTaskDay(task.day);
    setTaskStartTime(task.startTime || "09:00 AM");
    setTaskEndTime(task.endTime || "10:30 AM");
    setTaskDuration(task.durationMinutes || 90);
    setTaskPriority(task.priority || "medium");
    setTaskIsRevision(task.isRevision || false);
    setTaskIsPractice(task.isPractice || false);
    setTaskGuidance(task.guidance || "");
  };

  // Save Task Changes
  const handleSaveTaskEdit = async () => {
    if (!activePlan || !user || !editingTask) return;

    const updatedSlot = taskStartTime && taskEndTime ? `${taskStartTime} – ${taskEndTime}` : editingTask.timeSlot;

    const updatedTask: StudyTask = {
      ...editingTask,
      subject: taskSubject.trim() || editingTask.subject,
      topic: taskTopic.trim() || editingTask.topic,
      day: Number(taskDay) || editingTask.day,
      startTime: taskStartTime.trim(),
      endTime: taskEndTime.trim(),
      timeSlot: updatedSlot,
      durationMinutes: Number(taskDuration) || editingTask.durationMinutes,
      priority: taskPriority,
      isRevision: taskIsRevision,
      isPractice: taskIsPractice,
      guidance: taskGuidance.trim(),
    };

    const updatedTasks = activePlan.tasks.map((t) =>
      t.id === editingTask.id ? updatedTask : t
    );

    const updatedPlan: StudyPlan = {
      ...activePlan,
      tasks: updatedTasks,
    };

    setActivePlan(updatedPlan);
    setSavedPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    setEditingTask(null);

    try {
      await saveUserStudyPlan(user.uid, updatedPlan);
    } catch (err: any) {
      console.error("Failed to save edited task:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Could not save task edits to Firestore."));
    }
  };

  // Open Add Task Modal
  const handleOpenAddTask = () => {
    const maxDay = activePlan && activePlan.tasks.length > 0
      ? Math.max(...activePlan.tasks.map(t => t.day))
      : 1;

    setTaskSubject(activePlan?.subjects[0] || globalSubjects[0] || "");
    setTaskTopic("");
    setTaskDay(maxDay);
    setTaskStartTime("10:00 AM");
    setTaskEndTime("11:30 AM");
    setTaskDuration(90);
    setTaskPriority("medium");
    setTaskIsRevision(false);
    setTaskIsPractice(false);
    setTaskGuidance("");
    setIsAddingTask(true);
  };

  // Save New Task
  const handleSaveNewTask = async () => {
    if (!activePlan || !user) return;
    if (!taskTopic.trim()) {
      setErrorMessage("Please enter a task topic title.");
      return;
    }

    const newTask: StudyTask = {
      id: `task_custom_${Date.now()}`,
      day: Number(taskDay) || 1,
      date: "",
      subject: taskSubject.trim() || "Custom Subject",
      topic: taskTopic.trim(),
      startTime: taskStartTime.trim() || "09:00 AM",
      endTime: taskEndTime.trim() || "10:30 AM",
      timeSlot: `${taskStartTime.trim() || "09:00 AM"} – ${taskEndTime.trim() || "10:30 AM"}`,
      durationMinutes: Number(taskDuration) || 90,
      priority: taskPriority,
      isRevision: taskIsRevision,
      isPractice: taskIsPractice,
      guidance: taskGuidance.trim(),
      completed: false,
    };

    const updatedTasks = [...activePlan.tasks, newTask].sort((a, b) => a.day - b.day);

    const updatedPlan: StudyPlan = {
      ...activePlan,
      tasks: updatedTasks,
    };

    setActivePlan(updatedPlan);
    setSavedPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    setIsAddingTask(false);

    try {
      await saveUserStudyPlan(user.uid, updatedPlan);
    } catch (err: any) {
      console.error("Failed to save new task:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Could not save new task to Firestore."));
    }
  };

  // Delete Individual Task
  const handleDeleteTask = async (taskId: string) => {
    if (!activePlan || !user) return;

    const updatedTasks = activePlan.tasks.filter(t => t.id !== taskId);
    const updatedPlan: StudyPlan = {
      ...activePlan,
      tasks: updatedTasks,
    };

    setActivePlan(updatedPlan);
    setSavedPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));

    try {
      await saveUserStudyPlan(user.uid, updatedPlan);
    } catch (err: any) {
      console.error("Failed to delete task:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Could not delete task from Firestore."));
    }
  };

  // Open Edit Plan Details
  const handleOpenEditPlanInfo = () => {
    if (!activePlan) return;
    setEditPlanExamName(activePlan.examName);
    setEditPlanExamDate(activePlan.examDate);
    setEditPlanHours(activePlan.availableHoursPerDay);
    setEditPlanStartTime(activePlan.studyStartTime || "09:00 AM");
    setEditPlanEndTime(activePlan.studyEndTime || "01:00 PM");
    setIsEditingPlanInfo(true);
  };

  // Save Plan Details
  const handleSavePlanInfo = async () => {
    if (!activePlan || !user) return;

    const updatedPlan: StudyPlan = {
      ...activePlan,
      examName: editPlanExamName.trim() || activePlan.examName,
      examDate: editPlanExamDate || activePlan.examDate,
      availableHoursPerDay: Number(editPlanHours) || activePlan.availableHoursPerDay,
      studyStartTime: editPlanStartTime,
      studyEndTime: editPlanEndTime,
      studyTimeWindow: `${editPlanStartTime} – ${editPlanEndTime}`,
    };

    setActivePlan(updatedPlan);
    setSavedPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    setIsEditingPlanInfo(false);

    try {
      await saveUserStudyPlan(user.uid, updatedPlan);
    } catch (err: any) {
      console.error("Failed to save plan info:", err);
      setErrorMessage(getUserFriendlyErrorMessage(err, "Could not save plan info to Firestore."));
    }
  };

  const completedCount = activePlan ? activePlan.tasks.filter(t => t.completed).length : 0;
  const totalCount = activePlan ? activePlan.tasks.length : 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {errorMessage && (
        <ErrorBanner
          message={errorMessage}
          onRetry={handleGeneratePlan}
          onDismiss={() => setErrorMessage("")}
        />
      )}

      {/* Plan Selector & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {savedPlans.map(p => (
            <button
              key={p.id}
              id={`plan-tab-${p.id}`}
              onClick={() => setActivePlan(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1.5 cursor-pointer ${
                activePlan?.id === p.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{p.examName}</span>
            </button>
          ))}
        </div>

        <button
          id="new-plan-toggle-btn"
          onClick={() => setActivePlan(null)}
          className="flex items-center justify-center space-x-1 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer shrink-0"
        >
          <PlusIcon size={14} />
          <span>New Study Plan</span>
        </button>
      </div>

      {/* Form to generate new plan */}
      {!activePlan ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <CalendarIcon size={20} className="text-indigo-600" />
              <span>Create Spaced-Repetition Study Schedule</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gemini will generate day-by-day study sessions with specific time slots, revision blocks, and practice test milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Exam / Goal Name</label>
              <input
                id="exam-name-input"
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g. Midterms 2026"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Target Exam Date</label>
              <input
                id="exam-date-input"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Daily Study Hours</label>
              <input
                id="daily-hours-input"
                type="number"
                min={1}
                max={16}
                value={availableHours}
                onChange={(e) => {
                  const hrs = Number(e.target.value);
                  setAvailableHours(hrs);
                  if (hrs > 0 && hrs <= 16) {
                    const startDec = parseTimeToDecimalHours(studyStartTime);
                    setStudyEndTime(formatDecimalHoursTo12Hour(startDec + hrs));
                  }
                }}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Daily Study Schedule: From Time to To Time */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Daily Study Time Window (From & To)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select your exact study window. All daily sessions will be scheduled within this time range.
                </p>
              </div>
              <div className="inline-flex items-center space-x-1.5 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg text-indigo-700 font-semibold text-xs shrink-0">
                <span>{studyStartTime} – {studyEndTime}</span>
                <span className="text-indigo-400">({availableHours} hrs/day)</span>
              </div>
            </div>

            {/* Quick Schedule Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Quick Presets:</span>
              {SCHEDULE_PRESETS.map((preset) => {
                const isCurrent = studyStartTime === preset.start && studyEndTime === preset.end;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer flex items-center space-x-1 ${
                      isCurrent
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className={`text-[10px] ${isCurrent ? "text-indigo-200" : "text-slate-400"}`}>
                      ({preset.start.replace(':00', '')} - {preset.end.replace(':00', '')})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Time Selectors Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  From (Daily Start Time) <span className="text-indigo-600">*</span>
                </label>
                <div className="relative">
                  <select
                    id="study-start-time-select"
                    value={studyStartTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
                  >
                    {COMMON_TIME_OPTIONS.map((opt) => (
                      <option key={`start-${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  To (Daily End Time) <span className="text-indigo-600">*</span>
                </label>
                <div className="relative">
                  <select
                    id="study-end-time-select"
                    value={studyEndTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
                  >
                    {COMMON_TIME_OPTIONS.map((opt) => (
                      <option key={`end-${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Subjects Selection with Global Custom Subjects */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 block">
                Target Subjects
              </label>
              <span className="text-[11px] text-slate-400">
                Click custom subjects to include or add a new one
              </span>
            </div>

            {/* Chips from global subjects */}
            {globalSubjects.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Your Subjects:</span>
                {globalSubjects.map((sub) => {
                  const isSelected = selectedSubjectsList.includes(sub);
                  return (
                    <button
                      type="button"
                      key={sub}
                      onClick={() => handleToggleSubject(sub)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer flex items-center space-x-1 ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{sub}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selector to add more custom subjects directly */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SubjectSelector
                  value=""
                  onChange={(newSub) => {
                    if (newSub && !selectedSubjectsList.includes(newSub)) {
                      handleToggleSubject(newSub);
                    }
                  }}
                  placeholder="+ Add or select custom subject to include..."
                />
              </div>
            </div>

            <input
              id="subjects-input"
              type="text"
              value={subjectListInput}
              onChange={(e) => {
                setSubjectListInput(e.target.value);
                setSelectedSubjectsList(
                  e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                );
              }}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Operating Systems, Algorithms, Computer Networks"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Priority Chapters / Difficult Topics
            </label>
            <textarea
              id="topics-input"
              rows={3}
              value={topicsInput}
              onChange={(e) => setTopicsInput(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400"
              placeholder="e.g. OS: Process synchronization, semaphores, paging. Algorithms: Dynamic programming, Dijkstra."
            />
          </div>

          {/* Grounding on Uploaded Study Materials */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">
                  Ground Plan on Uploaded Study Materials
                </span>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Recommended
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMaterialsEnabled}
                    onChange={(e) => setIncludeMaterialsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            {includeMaterialsEnabled && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Select Materials to Build Tasks From:
                  </span>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedMaterialIds(availableMaterials.map(m => m.id))}
                      className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedMaterialIds([])}
                      className="text-slate-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {availableMaterials.length === 0 ? (
                  <div className="bg-white border border-dashed border-indigo-200 rounded-xl p-3 text-center text-xs text-slate-500">
                    <span>No uploaded study materials found yet. You can upload PDFs or notes in the </span>
                    <strong className="text-indigo-600">Study Materials</strong>
                    <span> tab anytime.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {availableMaterials.map((mat) => {
                      const isSelected = selectedMaterialIds.includes(mat.id);
                      return (
                        <div
                          key={mat.id}
                          onClick={() => toggleMaterialSelection(mat.id)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start space-x-2.5 ${
                            isSelected
                              ? "bg-white border-indigo-500 shadow-2xs ring-1 ring-indigo-500/20"
                              : "bg-white/70 border-slate-200 hover:bg-white"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4
                              className="text-xs font-bold text-slate-800 break-words whitespace-normal leading-snug"
                              title={mat.name}
                            >
                              {mat.name}
                            </h4>
                            <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mt-0.5">
                              <span className="font-semibold text-indigo-600">{mat.subject}</span>
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
          </div>

          <button
            id="generate-plan-btn"
            onClick={handleGeneratePlan}
            disabled={loading || !examName.trim()}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>
              {loading
                ? "Generating Schedule with Gemini 3.6 Flash..."
                : includeMaterialsEnabled && selectedMaterialIds.length > 0
                ? `Generate Study Plan (Grounded on ${selectedMaterialIds.length} Materials)`
                : "Generate Personalized Study Plan"}
            </span>
          </button>
        </div>
      ) : (
        /* Active Plan Task Breakdown */
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                    Target: {activePlan.examDate || "Upcoming"}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {activePlan.availableHoursPerDay} hrs / day
                  </span>
                  {(activePlan.studyTimeWindow || (activePlan.studyStartTime && activePlan.studyEndTime)) && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{activePlan.studyTimeWindow || `${activePlan.studyStartTime} – ${activePlan.studyEndTime}`}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <h2 className="text-lg font-bold text-slate-900">{activePlan.examName}</h2>
                  <button
                    onClick={handleOpenEditPlanInfo}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                    title="Edit Plan Title & Target Date"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{activePlan.planSummary}</p>

                {/* Grounding Study Materials Badge List */}
                {activePlan.includedMaterialNames && activePlan.includedMaterialNames.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Included Materials:</span>
                    </span>
                    {activePlan.includedMaterialNames.map((name, i) => (
                      <span
                        key={i}
                        className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-[10px] font-semibold px-2 py-0.5 rounded-md break-words"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  id="study-plan-notification-toggle-btn"
                  onClick={async () => {
                    if (!permissionGranted) {
                      await requestNotificationPermission();
                    }
                    triggerManualReminderCheck();
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    permissionGranted
                      ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                  title={
                    permissionGranted
                      ? "Time Alerts Active: Click to re-check scheduled task times"
                      : "Click to enable browser alerts for planned study hours"
                  }
                >
                  <BellRing className={`w-3.5 h-3.5 ${permissionGranted ? "text-emerald-600 animate-pulse" : "text-amber-600"}`} />
                  <span>{permissionGranted ? "Alerts Active" : "Enable Alerts"}</span>
                </button>

                <button
                  id="add-task-to-plan-btn"
                  onClick={handleOpenAddTask}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                  title="Add custom task"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>

                <button
                  id="delete-active-plan-btn"
                  onClick={() => handleDeletePlan(activePlan.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  title="Delete Study Plan"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Schedule Completion</span>
                <span className="text-indigo-600">{completedCount} of {totalCount} tasks ({progressPercent}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Task List Header */}
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Study Schedule Tasks ({activePlan.tasks.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              Click checkbox to mark complete, or click pencil to edit time & details
            </span>
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {activePlan.tasks.map((task) => {
              const timeDisplay =
                task.startTime && task.endTime
                  ? `${task.startTime} – ${task.endTime}`
                  : task.timeSlot || "";

              return (
                <div
                  key={task.id}
                  id={`task-item-${task.id}`}
                  className={`p-4 rounded-2xl border transition flex items-start space-x-3.5 ${
                    task.completed
                      ? "bg-slate-50 border-slate-200/80 opacity-75"
                      : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs"
                  }`}
                >
                  <button
                    id={`toggle-task-btn-${task.id}`}
                    onClick={() => handleToggleTask(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 focus:outline-none shrink-0 cursor-pointer"
                  >
                    {task.completed ? (
                      <CheckboxCheckedIcon size={20} className="text-emerald-600" />
                    ) : (
                      <CheckboxEmptyIcon size={20} />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Day {task.day}
                      </span>
                      <span className="text-xs font-bold text-indigo-700">
                        {task.subject}
                      </span>

                      {/* Time slot display: which time to which */}
                      {timeDisplay && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-indigo-600" />
                          <span>{timeDisplay}</span>
                        </span>
                      )}

                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        task.priority === "high"
                          ? "text-red-700 bg-red-50"
                          : "text-slate-600 bg-slate-100"
                      }`}>
                        {task.durationMinutes} mins
                      </span>

                      {task.isRevision && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Spaced Revision
                        </span>
                      )}
                      {task.isPractice && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          Practice Test
                        </span>
                      )}
                      {task.materialName && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center space-x-1">
                          <FileText className="w-3 h-3 text-indigo-500" />
                          <span className="break-words">{task.materialName}</span>
                        </span>
                      )}
                    </div>

                    <h4 className={`text-sm font-semibold text-slate-900 ${task.completed ? "line-through text-slate-500" : ""}`}>
                      {task.topic}
                    </h4>

                    {task.guidance && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {task.guidance}
                      </p>
                    )}
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center space-x-1 shrink-0 pt-0.5">
                    <button
                      id={`edit-task-btn-${task.id}`}
                      type="button"
                      onClick={() => handleOpenEditTask(task)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                      title="Edit Task & Time Slot"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`delete-task-btn-${task.id}`}
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Study Task & Time Slot</h3>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Subject</label>
                <SubjectSelector
                  value={taskSubject}
                  onChange={setTaskSubject}
                  placeholder="Select or enter subject..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Task Topic</label>
                <input
                  type="text"
                  value={taskTopic}
                  onChange={(e) => setTaskTopic(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Memory Paging & Replacement Algorithms"
                />
              </div>

              {/* Time Slot Fields: which time to which */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                <div>
                  <label className="text-xs font-semibold text-indigo-950 flex items-center space-x-1 mb-1">
                    <Clock className="w-3 h-3 text-indigo-600" />
                    <span>Start Time</span>
                  </label>
                  <input
                    type="text"
                    value={taskStartTime}
                    onChange={(e) => setTaskStartTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. 09:00 AM or 14:00"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-indigo-950 flex items-center space-x-1 mb-1">
                    <Clock className="w-3 h-3 text-indigo-600" />
                    <span>End Time</span>
                  </label>
                  <input
                    type="text"
                    value={taskEndTime}
                    onChange={(e) => setTaskEndTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. 10:30 AM or 15:30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Schedule Day</label>
                  <input
                    type="number"
                    min={1}
                    value={taskDay}
                    onChange={(e) => setTaskDay(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={taskDuration}
                    onChange={(e) => setTaskDuration(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taskIsRevision}
                    onChange={(e) => setTaskIsRevision(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Spaced Revision Session</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taskIsPractice}
                    onChange={(e) => setTaskIsPractice(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Practice Milestone</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Guidance / Notes</label>
                <textarea
                  rows={2}
                  value={taskGuidance}
                  onChange={(e) => setTaskGuidance(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400"
                  placeholder="Focus on LRU page replacement algorithm derivation..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTaskEdit}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW TASK MODAL */}
      {isAddingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Add Custom Study Task</h3>
              </div>
              <button
                onClick={() => setIsAddingTask(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Subject</label>
                <SubjectSelector
                  value={taskSubject}
                  onChange={setTaskSubject}
                  placeholder="Select or enter subject..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Task Topic</label>
                <input
                  type="text"
                  value={taskTopic}
                  onChange={(e) => setTaskTopic(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Dijkstra's Algorithm Problem Set"
                />
              </div>

              {/* Time Slot Fields */}
              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Time Slot (From Time to To Time)</span>
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-700">
                    {taskStartTime} – {taskEndTime} ({taskDuration} min)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-indigo-950 flex items-center space-x-1 mb-1">
                      <span>From (Start Time)</span>
                    </label>
                    <input
                      type="text"
                      list="study-time-options"
                      value={taskStartTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTaskStartTime(val);
                        const dur = Math.round(calculateHoursBetween(val, taskEndTime) * 60);
                        if (dur > 0 && dur <= 480) setTaskDuration(dur);
                      }}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. 09:00 AM"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-indigo-950 flex items-center space-x-1 mb-1">
                      <span>To (End Time)</span>
                    </label>
                    <input
                      type="text"
                      list="study-time-options"
                      value={taskEndTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTaskEndTime(val);
                        const dur = Math.round(calculateHoursBetween(taskStartTime, val) * 60);
                        if (dur > 0 && dur <= 480) setTaskDuration(dur);
                      }}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. 10:30 AM"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Schedule Day</label>
                  <input
                    type="number"
                    min={1}
                    value={taskDay}
                    onChange={(e) => setTaskDay(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={taskDuration}
                    onChange={(e) => setTaskDuration(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taskIsRevision}
                    onChange={(e) => setTaskIsRevision(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Spaced Revision Session</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taskIsPractice}
                    onChange={(e) => setTaskIsPractice(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Practice Milestone</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Guidance / Notes</label>
                <textarea
                  rows={2}
                  value={taskGuidance}
                  onChange={(e) => setTaskGuidance(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400"
                  placeholder="Review lecture slides chapter 4..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewTask}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task to Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PLAN INFO MODAL */}
      {isEditingPlanInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Plan Details</h3>
              </div>
              <button
                onClick={() => setIsEditingPlanInfo(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Exam / Plan Name</label>
                <input
                  type="text"
                  value={editPlanExamName}
                  onChange={(e) => setEditPlanExamName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Exam Date</label>
                <input
                  type="date"
                  value={editPlanExamDate}
                  onChange={(e) => setEditPlanExamDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Daily Available Hours</label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={editPlanHours}
                  onChange={(e) => {
                    const hrs = Number(e.target.value);
                    setEditPlanHours(hrs);
                    if (hrs > 0 && hrs <= 16) {
                      const startDec = parseTimeToDecimalHours(editPlanStartTime);
                      setEditPlanEndTime(formatDecimalHoursTo12Hour(startDec + hrs));
                    }
                  }}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Edit Time Window */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">From (Start Time)</label>
                  <select
                    value={editPlanStartTime}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditPlanStartTime(val);
                      const hrs = calculateHoursBetween(val, editPlanEndTime);
                      if (hrs > 0 && hrs <= 16) setEditPlanHours(hrs);
                    }}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    {COMMON_TIME_OPTIONS.map((opt) => (
                      <option key={`edit-start-${opt}`} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">To (End Time)</label>
                  <select
                    value={editPlanEndTime}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditPlanEndTime(val);
                      const hrs = calculateHoursBetween(editPlanStartTime, val);
                      if (hrs > 0 && hrs <= 16) setEditPlanHours(hrs);
                    }}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    {COMMON_TIME_OPTIONS.map((opt) => (
                      <option key={`edit-end-${opt}`} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditingPlanInfo(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePlanInfo}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Datalist for common time autocomplete */}
      <datalist id="study-time-options">
        {COMMON_TIME_OPTIONS.map((t) => (
          <option key={`datalist-${t}`} value={t} />
        ))}
      </datalist>
    </div>
  );
};
