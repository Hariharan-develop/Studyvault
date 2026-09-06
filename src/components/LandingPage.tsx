import React from "react";
import { Folder, MessageSquare, FileText, Calendar } from "lucide-react";
import { StudyVaultLogoMark } from "./common/StudyVaultLogo";
import { useAuth } from "../context/AuthContext";

export const LandingPage: React.FC = () => {
  const { signInWithGoogle, loading, error } = useAuth();

  const featureCards = [
    {
      id: "feature-materials",
      icon: Folder,
      title: "Study Materials",
      description:
        "Upload PDFs, lecture notes, slides, and syllabus files to extract concepts, query with AI, and study in-depth.",
      iconBg: "bg-[#EDE9FE]",
      iconColor: "text-[#7C3AED]",
    },
    {
      id: "feature-chat",
      icon: MessageSquare,
      title: "AI Study Chat",
      description:
        "Ask deep conceptual questions, clarify tricky code or formulas, and engage in multi-turn tutor dialogues.",
      iconBg: "bg-[#DBEAFE]",
      iconColor: "text-[#2563EB]",
    },
    {
      id: "feature-notes",
      icon: FileText,
      title: "Smart Notes",
      description:
        "Turn your study material into structured summaries, definitions, and active-recall points.",
      iconBg: "bg-[#DCFCE7]",
      iconColor: "text-[#16A34A]",
    },
    {
      id: "feature-planner",
      icon: Calendar,
      title: "Study Planner",
      description:
        "Create personalized study plans with schedules, goals, and practice milestones.",
      iconBg: "bg-[#FEF3C7]",
      iconColor: "text-[#D97706]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFD] relative flex flex-col justify-between overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900 font-sans text-slate-800">
      {/* Soft Ambient Background Glows */}
      <div
        className="absolute top-0 right-0 w-[550px] h-[550px] rounded-full pointer-events-none blur-3xl -z-10"
        style={{
          background:
            "radial-gradient(circle, rgba(224, 231, 255, 0.6) 0%, rgba(243, 232, 255, 0.4) 45%, rgba(250, 251, 253, 0) 75%)",
        }}
      />
      <div
        className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full pointer-events-none blur-3xl -z-10"
        style={{
          background:
            "radial-gradient(circle, rgba(219, 234, 254, 0.5) 0%, rgba(237, 233, 254, 0.35) 45%, rgba(250, 251, 253, 0) 75%)",
        }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none blur-3xl -z-10"
        style={{
          background:
            "radial-gradient(circle, rgba(238, 242, 255, 0.55) 0%, rgba(250, 251, 253, 0) 70%)",
        }}
      />

      {/* Top Header */}
      <header className="w-full px-6 sm:px-12 py-5 flex items-center justify-between z-10">
        {/* Brand Lockup: StudyVault AI */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <StudyVaultLogoMark size={40} className="rounded-xl shadow-xs" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5 leading-none">
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                StudyVault
              </span>
              <span className="text-lg font-extrabold tracking-tight text-indigo-600">
                AI
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium tracking-normal mt-0.5">
              Academic Companion
            </span>
          </div>
        </div>

        {/* Right Navigation / Slogan */}
        <div className="text-xs sm:text-sm font-medium text-slate-500 tracking-wider select-none flex items-center space-x-2">
          <span>Learn</span>
          <span className="text-slate-300">·</span>
          <span>Plan</span>
          <span className="text-slate-300">·</span>
          <span>Grow</span>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-center items-center py-6 sm:py-10 relative z-10">
        {/* Top-Left Decorative Dot Matrix (Matching image) */}
        <div className="hidden lg:grid grid-cols-4 gap-2.5 absolute left-8 top-12 opacity-65 pointer-events-none select-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300/80" />
          ))}
        </div>

        {/* Left Handwritten Script: "A brighter you, every day" */}
        <div className="hidden xl:flex flex-col items-start absolute left-6 2xl:left-14 top-24 -rotate-12 pointer-events-none select-none text-indigo-400/80">
          <span
            className="text-2xl 2xl:text-3xl font-bold tracking-wide"
            style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
          >
            A brighter
            <br />
            you, every day
          </span>
          {/* Handwritten underline doodle */}
          <svg
            className="w-28 h-4 text-indigo-300/90 -mt-1 -ml-1 stroke-current"
            viewBox="0 0 110 18"
            fill="none"
          >
            <path
              d="M3 8C28 14 62 13 105 5"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Right Handwritten Script: "Knowledge lives here" */}
        <div className="hidden xl:flex flex-col items-start absolute right-24 2xl:right-32 top-14 -rotate-8 pointer-events-none select-none text-indigo-400/80">
          <span
            className="text-2xl 2xl:text-3xl font-bold tracking-wide"
            style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
          >
            Knowledge
            <br />
            lives here
          </span>
          {/* Handwritten underline doodle */}
          <svg
            className="w-24 h-4 text-indigo-300/90 -mt-1 -ml-1 stroke-current"
            viewBox="0 0 100 18"
            fill="none"
          >
            <path
              d="M4 10C24 15 55 14 94 6"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Right Background 3D Academic Cap on Books Graphic (Matching screenshot) */}
        <div className="hidden lg:block absolute right-2 2xl:right-8 top-1/2 -translate-y-1/2 pointer-events-none select-none opacity-85 w-64 h-64">
          <svg
            viewBox="0 0 300 300"
            className="w-full h-full drop-shadow-[0_20px_35px_rgba(165,180,252,0.35)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="bookBottomGrad"
                x1="40"
                y1="210"
                x2="260"
                y2="250"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#EDE9FE" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#F5F3FF" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient
                id="bookMidGrad"
                x1="50"
                y1="170"
                x2="250"
                y2="210"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#EEF2FF" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#E0E7FF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient
                id="capTopGrad"
                x1="80"
                y1="80"
                x2="220"
                y2="150"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#C7D2FE" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#818CF8" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient
                id="capFacetGrad"
                x1="120"
                y1="120"
                x2="180"
                y2="175"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3730A3" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient
                id="tasselGrad"
                x1="150"
                y1="100"
                x2="210"
                y2="160"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>

            {/* Bottom Book */}
            <g transform="translate(10, 15)">
              {/* Pages block */}
              <path
                d="M50 200 L150 225 L250 200 L250 216 L150 241 L50 216 Z"
                fill="#FFFFFF"
                opacity="0.95"
              />
              {/* Cover top */}
              <path
                d="M45 198 L150 223 L255 198 L150 178 Z"
                fill="url(#bookBottomGrad)"
              />
              {/* Cover spine */}
              <path
                d="M45 198 L150 223 L150 231 L45 206 Z"
                fill="#C7D2FE"
                opacity="0.8"
              />
              <path
                d="M150 223 L255 198 L255 206 L150 231 Z"
                fill="#DDD6FE"
                opacity="0.75"
              />
            </g>

            {/* Top Book */}
            <g transform="translate(18, -10)">
              {/* Pages block */}
              <path
                d="M55 180 L145 202 L235 180 L235 194 L145 216 L55 194 Z"
                fill="#FFFFFF"
                opacity="0.95"
              />
              {/* Cover top */}
              <path
                d="M50 178 L145 200 L240 178 L145 160 Z"
                fill="url(#bookMidGrad)"
              />
              {/* Cover spine */}
              <path
                d="M50 178 L145 200 L145 207 L50 185 Z"
                fill="#BFDBFE"
                opacity="0.85"
              />
              <path
                d="M145 200 L240 178 L240 185 L145 207 Z"
                fill="#C7D2FE"
                opacity="0.8"
              />
            </g>

            {/* Graduation Cap (Mortarboard) */}
            <g transform="translate(12, -28)">
              {/* Skull Cap base under mortarboard */}
              <ellipse
                cx="150"
                cy="148"
                rx="34"
                ry="14"
                fill="url(#capFacetGrad)"
              />
              <path
                d="M116 148 C116 166 184 166 184 148 L184 158 C184 176 116 176 116 158 Z"
                fill="#312E81"
                opacity="0.7"
              />

              {/* Diamond Cap Top Plate */}
              <path
                d="M150 88 L230 118 L150 148 L70 118 Z"
                fill="url(#capTopGrad)"
                stroke="#A5B4FC"
                strokeWidth="1.5"
              />
              {/* Subtle top bevel/depth */}
              <path
                d="M70 118 L150 148 L150 152 L70 122 Z"
                fill="#4338CA"
                opacity="0.5"
              />
              <path
                d="M150 148 L230 118 L230 122 L150 152 Z"
                fill="#3730A3"
                opacity="0.6"
              />

              {/* Center button */}
              <ellipse
                cx="150"
                cy="118"
                rx="5"
                ry="3"
                fill="#FEF08A"
                stroke="#CA8A04"
                strokeWidth="0.8"
              />

              {/* Tassel cord */}
              <path
                d="M150 118 Q190 120 205 142"
                stroke="url(#tasselGrad)"
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
              />
              {/* Tassel fringe */}
              <path
                d="M205 142 L208 165 L202 165 Z"
                fill="#F59E0B"
              />
              <circle cx="205" cy="144" r="2.5" fill="#EAB308" />
            </g>
          </svg>
        </div>

        {/* Center Hero Content */}
        <div className="w-full max-w-4xl flex flex-col items-center text-center">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm max-w-md shadow-xs animate-shake">
              {error}
            </div>
          )}

          {/* Floating Shield App Logo Emblem */}
          <div className="relative mb-5 group">
            <div className="absolute -inset-3 bg-gradient-to-r from-indigo-500/25 via-purple-500/25 to-sky-500/25 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
            <div className="relative p-1 rounded-2xl bg-white shadow-lg border border-slate-100 backdrop-blur-xs">
              <StudyVaultLogoMark
                size={74}
                className="rounded-xl transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Pill Badge: Zero-Knowledge Isolation */}
          <div className="inline-flex items-center space-x-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-1.5 mb-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-semibold text-slate-700">
              Zero-Knowledge Isolation &amp; Google Authenticated
            </span>
          </div>

          {/* Headline (Study Smarter. Remember More.) */}
          <h1 className="text-4xl sm:text-6xl lg:text-6.5xl font-extrabold tracking-tight text-slate-900 leading-[1.12] mb-4">
            Study Smarter.
            <br />
            <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#D946EF] bg-clip-text text-transparent">
              Remember More.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed mb-8">
            Your private AI-powered learning companion for study materials,
            notes, planning, and study conversations.
          </p>

          {/* Primary CTA Button: Continue with Google → */}
          <div className="mb-14">
            <button
              id="hero-sign-in-button"
              type="button"
              onClick={signInWithGoogle}
              disabled={loading}
              className="inline-flex items-center space-x-3 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] text-white px-7 py-3.5 shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(37,99,235,0.5)] transition-all duration-200 cursor-pointer group"
            >
              {/* White Circle with Authentic Google G Logo */}
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.96 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>

              <span className="font-semibold text-white text-base tracking-tight">
                {loading ? "Connecting securely..." : "Continue with Google"}
              </span>

              <span className="text-white text-lg font-normal leading-none ml-1 group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </button>
          </div>

          {/* 4 Feature Cards Row (Study Materials, AI Study Chat, Smart Notes, Study Planner) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full text-left">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  id={card.id}
                  className="bg-white rounded-2xl p-6 border border-slate-100/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_-4px_rgba(99,102,241,0.12)] hover:border-indigo-100 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Icon Container */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${card.iconBg} ${card.iconColor}`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>

                    {/* Card Title */}
                    <h3 className="text-base font-bold text-slate-900 mb-2">
                      {card.title}
                    </h3>

                    {/* Card Description */}
                    <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed font-normal">
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Clean Bottom Footer */}
      <footer className="w-full py-5 text-center text-xs text-slate-500 font-medium z-10 flex items-center justify-center space-x-2">
        <span>Built with ❤️ for learners</span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-600">StudyVault AI</span>
      </footer>
    </div>
  );
};
