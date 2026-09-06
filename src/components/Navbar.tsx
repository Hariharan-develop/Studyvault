import React, { useState, useRef, useEffect } from "react";
import { Menu, Clock, Trash2, BellRing } from "lucide-react";
import { BellIcon, ChevronDownIcon, LogoutIcon } from "./icons/AppIcons";
import { ProfileAvatar } from "./common/ProfileAvatar";
import { StudyVaultLogoMark } from "./common/StudyVaultLogo";
import { ActiveTab } from "../types";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

interface NavbarProps {
  activeTab: ActiveTab;
  onOpenSidebar: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

const TAB_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Overview of your learning journey" },
  materials: { title: "Study Materials", subtitle: "Manage your textbooks, notes & syllabi" },
  chat: { title: "AI Study Chat", subtitle: "Interactive tutoring & concept mastery" },
  planner: { title: "Study Planner", subtitle: "Personalized timetables & focus schedules" },
  notes: { title: "Smart Notes", subtitle: "Synthesized takeaways & key formulas" },
  reflection: { title: "Daily Reflection", subtitle: "Track metacognition & daily insights" },
  vault: { title: "Study Vault", subtitle: "Private archive of saved learning items" },
};

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onOpenSidebar, onNavigateTab }) => {
  const { user, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    permissionGranted,
    requestNotificationPermission,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    triggerManualReminderCheck,
  } = useNotifications();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const displayName = user?.displayName || (user?.email ? user.email.split("@")[0] : "Student");
  const currentTabMeta = TAB_TITLES[activeTab] || { title: "StudyVault AI", subtitle: "Smart Learning Companion" };

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-18 border-b border-slate-200/80 bg-white px-3.5 sm:px-5 lg:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Mobile Toggle & Active Section Title */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          id="mobile-menu-toggle-button"
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 lg:hidden shrink-0 cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile Brand Mark */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden shrink-0 flex items-center space-x-1.5 focus:outline-none cursor-pointer"
          aria-label="StudyVault AI"
        >
          <StudyVaultLogoMark size={30} className="rounded-xl shadow-2xs" />
        </button>

        {/* Active Section Title & Subtitle */}
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
            {currentTabMeta.title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 truncate leading-snug">
            {currentTabMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls: Notifications & User Profile */}
      <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
        {/* Notification Bell with interactive popover */}
        <div className="relative" ref={notifRef}>
          <button
            id="notifications-button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className={`relative p-2 rounded-xl transition cursor-pointer ${
              showNotifications
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/70"
            }`}
            aria-label="Notifications"
            title="Study Planner Notifications"
          >
            <BellIcon size={20} className={unreadCount > 0 ? "text-indigo-600" : "text-slate-500"} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900">Study Alerts</span>
                  {unreadCount > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      title="Clear all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Native desktop push notification permission prompt if not granted */}
              {!permissionGranted && (
                <div className="mx-3 my-2 p-2.5 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-indigo-900">
                    <BellRing className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="leading-tight text-[11px]">Enable browser alerts for study timers</span>
                  </div>
                  <button
                    onClick={requestNotificationPermission}
                    className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-bold hover:bg-indigo-700 transition shrink-0 cursor-pointer"
                  >
                    Enable
                  </button>
                </div>
              )}

              {/* Notification list */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">No active study alerts</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto">
                      When your planned study time approaches, alerts with sound will appear here.
                    </p>
                    <button
                      onClick={triggerManualReminderCheck}
                      className="mt-3 text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Check Study Schedules Now
                    </button>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (onNavigateTab) onNavigateTab("planner");
                        setShowNotifications(false);
                      }}
                      className={`p-3 transition cursor-pointer hover:bg-slate-50 flex items-start space-x-3 ${
                        notif.read ? "opacity-70 bg-white" : "bg-indigo-50/30"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          notif.type === "starting_now"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{notif.title}</h4>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug break-words">{notif.message}</p>
                        {notif.timeSlot && (
                          <div className="mt-1.5 flex items-center space-x-1.5 text-[10px] font-semibold text-indigo-700">
                            <span className="bg-indigo-100 px-1.5 py-0.5 rounded">{notif.timeSlot}</span>
                            {notif.subject && <span>• {notif.subject}</span>}
                          </div>
                        )}
                      </div>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5"></span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="pt-2 px-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Timetable synchronized</span>
                  <button
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab("planner");
                      setShowNotifications(false);
                    }}
                    className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    Open Study Planner →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Pill with Dropdown */}
        <div className="relative">
          <button
            id="user-profile-menu-button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-3 p-1.5 pr-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
          >
            <ProfileAvatar
              photoURL={user?.photoURL}
              displayName={displayName}
              size={36}
            />

            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-tight">
                {displayName}
              </p>
              <p className="text-xs text-slate-400 font-medium leading-tight">
                Student
              </p>
            </div>

            <ChevronDownIcon size={16} className="text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed In As</p>
                <p className="text-sm font-medium text-slate-800 truncate">{user?.email || "hariorginal@gmail.com"}</p>
              </div>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition"
              >
                <LogoutIcon size={18} className="text-rose-600 mr-2" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
