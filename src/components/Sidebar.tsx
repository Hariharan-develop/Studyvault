import React from "react";
import { X, FolderOpen } from "lucide-react";
import {
  DashboardIcon,
  ChatIcon,
  NotesIcon,
  CalendarIcon,
  ReflectionBookIcon,
  VaultIcon,
  LogoutIcon,
  GraduationCapIcon,
  StudyVaultLogoIcon,
} from "./icons/AppIcons";
import { ActiveTab } from "../types";
import { useAuth } from "../context/AuthContext";
import { GraduationCap3DIcon } from "./icons/GraduationCap3DIcon";
import { StudyVaultBrandLockup } from "./common/StudyVaultLogo";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
}) => {
  const { logout } = useAuth();

  const navigationItems: Array<{ id: string; label: string; icon: React.FC<any>; badge?: string }> = [
    { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
    { id: "materials", label: "Study Materials", icon: FolderOpen },
    { id: "chat", label: "AI Study Chat", icon: ChatIcon },
    { id: "planner", label: "Study Planner", icon: CalendarIcon },
    { id: "notes", label: "Smart Notes", icon: NotesIcon },
    { id: "reflection", label: "Daily Reflection", icon: ReflectionBookIcon },
    { id: "vault", label: "Study Vault", icon: VaultIcon },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <StudyVaultBrandLockup size={38} subtitle="Learn • Plan • Grow" />
            <button
              id="close-sidebar-button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleSelect(item.id as ActiveTab)}
                  className={`relative w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition group ${
                    isActive
                      ? "bg-indigo-50/90 text-indigo-600 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-600 rounded-r-full" />
                  )}
                  <Icon
                    className={`w-5 h-5 mr-3 shrink-0 ${
                      isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-600 text-white leading-none">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Motivational Card & Logout Footer */}
        <div className="p-4 space-y-3">
          {/* Consistency Motivational Card matching motivation_card_reference */}
          <div
            id="sidebar-motivation-card"
            className="bg-gradient-to-b from-[#F2F4FF] via-[#ECF0FF] to-[#E2E8FF] border border-[#D5DEFF] rounded-2xl p-5 text-center shadow-xs"
          >
            <div className="flex items-center justify-center mb-3">
              <GraduationCap3DIcon size={44} className="transform hover:scale-105 transition-transform" />
            </div>
            <p className="text-sm font-bold text-[#1A2556] leading-snug tracking-tight">
              Consistency<br />
              today builds a<br />
              brighter tomorrow.
            </p>
          </div>

          {/* Logout Button */}
          <button
            id="sidebar-logout-button"
            onClick={logout}
            className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition"
          >
            <LogoutIcon size={20} className="mr-3 shrink-0 text-slate-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
