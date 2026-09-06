import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SubjectProvider } from "./context/SubjectContext";
import { LandingPage } from "./components/LandingPage";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { DashboardOverview } from "./components/dashboard/DashboardOverview";
import { StudyChat } from "./components/chat/StudyChat";
import { SmartNotes } from "./components/notes/SmartNotes";
import { StudyMaterials } from "./components/materials/StudyMaterials";
import { StudyPlanner } from "./components/planner/StudyPlanner";
import { DailyReflectionComponent } from "./components/reflection/DailyReflection";
import { StudyVault } from "./components/vault/StudyVault";
import { ActiveTab, StudyMaterial } from "./types";
import { NotificationProvider } from "./context/NotificationContext";
import { LogoIcon } from "./components/icons/AppIcons";

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [preselectedMaterial, setPreselectedMaterial] = useState<StudyMaterial | null>(null);

  const handleNavigateWithMaterial = (tab: ActiveTab, material?: StudyMaterial) => {
    if (material) {
      setPreselectedMaterial(material);
    }
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white animate-pulse shadow-md">
          <LogoIcon size={24} className="text-white" />
        </div>
        <p className="text-xs font-semibold text-slate-600 tracking-wide">
          Connecting to StudyVault AI...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="h-screen bg-[#F8FAFC] flex overflow-hidden text-slate-800 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        <Navbar
          activeTab={activeTab}
          onOpenSidebar={() => setSidebarOpen(true)}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />

        <main className="flex-1 w-full max-w-none px-4 sm:px-6 py-4 sm:py-5 min-w-0">
          {activeTab === "dashboard" && (
            <DashboardOverview onNavigate={setActiveTab} />
          )}
          {activeTab === "chat" && (
            <StudyChat
              preselectedMaterial={preselectedMaterial}
              onNavigateToMaterials={() => handleNavigateWithMaterial("materials")}
            />
          )}
          {activeTab === "materials" && (
            <StudyMaterials onNavigate={handleNavigateWithMaterial} />
          )}
          {activeTab === "notes" && (
            <SmartNotes
              preselectedMaterial={preselectedMaterial}
              onNavigateWithMaterial={handleNavigateWithMaterial}
            />
          )}
          {activeTab === "planner" && <StudyPlanner />}
          {activeTab === "reflection" && <DailyReflectionComponent />}
          {activeTab === "vault" && <StudyVault onNavigate={setActiveTab} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SubjectProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </SubjectProvider>
    </AuthProvider>
  );
}
