import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { fetchUserStudyPlans } from "../lib/firestore-helpers";
import { StudyPlan, StudyTask } from "../types";

export interface StudyNotification {
  id: string;
  title: string;
  message: string;
  planId?: string;
  taskId?: string;
  subject?: string;
  timeSlot?: string;
  type: "upcoming" | "starting_now" | "review" | "general";
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: StudyNotification[];
  unreadCount: number;
  permissionGranted: boolean;
  requestNotificationPermission: () => Promise<boolean>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  triggerManualReminderCheck: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Audio chime using Web Audio API so it works without external assets
const playStudyChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch (err) {
    // Audio contexts may be blocked by autoplay policies until user interaction
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<StudyNotification[]>([]);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [notifiedTaskKeys, setNotifiedTaskKeys] = useState<Set<string>>(new Set());

  // Check initial browser notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionGranted(Notification.permission === "granted");
    }
  }, []);

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      const granted = perm === "granted";
      setPermissionGranted(granted);
      return granted;
    } catch (err) {
      console.warn("Notification permission request error:", err);
      return false;
    }
  };

  const dispatchNotification = useCallback(
    (item: Omit<StudyNotification, "id" | "timestamp" | "read">) => {
      const newNotif: StudyNotification = {
        ...item,
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev]);
      playStudyChime();

      // If browser native notification is permitted, display it
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(item.title, {
            body: item.message,
            icon: "/favicon.ico",
          });
        } catch (e) {
          console.warn("Could not dispatch desktop notification:", e);
        }
      }
    },
    []
  );

  // Check scheduled study tasks against the current local time
  const checkStudySchedules = useCallback(async () => {
    if (!user) return;
    try {
      const plans = await fetchUserStudyPlans(user.uid);
      if (!plans || plans.length === 0) return;

      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const nowDecimalHours = currentHours + currentMinutes / 60;
      const todayDateStr = now.toISOString().split("T")[0];

      plans.forEach((plan: StudyPlan) => {
        if (!plan.tasks || plan.tasks.length === 0) return;

        plan.tasks.forEach((task: StudyTask) => {
          if (task.completed) return;

          // Parse start time (e.g., "09:00 AM" or "14:30")
          const timeToParse = task.startTime || task.timeSlot;
          if (!timeToParse) return;

          let taskStartHour = 0;
          const match12 = timeToParse.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
          if (match12) {
            let h = parseInt(match12[1], 10);
            const m = parseInt(match12[2], 10);
            const meridiem = match12[3].toUpperCase();
            if (meridiem === "PM" && h < 12) h += 12;
            if (meridiem === "AM" && h === 12) h = 0;
            taskStartHour = h + m / 60;
          } else {
            const match24 = timeToParse.trim().match(/^(\d{1,2}):(\d{2})$/);
            if (match24) {
              taskStartHour = parseInt(match24[1], 10) + parseInt(match24[2], 10) / 60;
            } else {
              return;
            }
          }

          // Compute difference in minutes between now and task start
          const diffInMinutes = (taskStartHour - nowDecimalHours) * 60;

          // Case 1: Upcoming in 10 minutes (between 0 and 12 mins before start)
          const key10Min = `${plan.id}_${task.id}_10min_${todayDateStr}`;
          if (diffInMinutes > 0 && diffInMinutes <= 12 && !notifiedTaskKeys.has(key10Min)) {
            setNotifiedTaskKeys((prev) => new Set(prev).add(key10Min));
            dispatchNotification({
              title: `⏰ Upcoming: ${task.subject} in ~${Math.max(1, Math.round(diffInMinutes))} min`,
              message: `Scheduled topic: "${task.topic}" starts at ${task.startTime || timeToParse}. Get your materials ready!`,
              planId: plan.id,
              taskId: task.id,
              subject: task.subject,
              timeSlot: task.startTime || timeToParse,
              type: "upcoming",
            });
          }

          // Case 2: Starting now (between -5 and +3 mins)
          const keyNow = `${plan.id}_${task.id}_now_${todayDateStr}`;
          if (diffInMinutes <= 2 && diffInMinutes >= -15 && !notifiedTaskKeys.has(keyNow)) {
            setNotifiedTaskKeys((prev) => new Set(prev).add(keyNow));
            dispatchNotification({
              title: `📖 Study Time Started: ${task.subject}`,
              message: `Now starting: "${task.topic}" (${task.durationMinutes} mins). Time to focus and learn!`,
              planId: plan.id,
              taskId: task.id,
              subject: task.subject,
              timeSlot: task.startTime || timeToParse,
              type: "starting_now",
            });
          }
        });
      });
    } catch (err) {
      console.warn("Failed to check study plan schedules:", err);
    }
  }, [user, dispatchNotification, notifiedTaskKeys]);

  // Periodic interval checking every 45 seconds
  useEffect(() => {
    if (!user) return;
    checkStudySchedules();
    const interval = setInterval(() => {
      checkStudySchedules();
    }, 45000);
    return () => clearInterval(interval);
  }, [user, checkStudySchedules]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        permissionGranted,
        requestNotificationPermission,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        triggerManualReminderCheck: checkStudySchedules,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
