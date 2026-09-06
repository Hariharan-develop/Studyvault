import React, { useId } from "react";

export interface StudyVaultLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  variant?: "icon" | "minimal" | "shield";
}

/**
 * Unique, bespoke brand logo for StudyVault AI.
 * Combines:
 * 1. The Secure Knowledge Vault (isometric shield & safe lock geometry)
 * 2. The Open Academic Tome (illuminated wings of study & notes)
 * 3. The AI Intelligence Spark (brilliant 4-point golden neural nexus)
 */
export const StudyVaultLogoMark: React.FC<StudyVaultLogoProps> = ({
  size = 36,
  className = "",
  variant = "icon",
  ...props
}) => {
  const id = useId().replace(/:/g, "_");
  const bgGradId = `sv-bg-grad-${id}`;
  const shieldGradId = `sv-shield-grad-${id}`;
  const bookLeftGradId = `sv-book-left-${id}`;
  const bookRightGradId = `sv-book-right-${id}`;
  const vaultRingGradId = `sv-vault-ring-${id}`;
  const starGradId = `sv-star-grad-${id}`;
  const glowFilterId = `sv-glow-filter-${id}`;
  const innerShadowId = `sv-inner-shadow-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="StudyVault AI Logo"
      {...props}
    >
      <defs>
        {/* Outer Background Container Gradient */}
        <linearGradient id={bgGradId} x1="12" y1="8" x2="88" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="45%" stopColor="#3730A3" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>

        {/* Shield Facet Gradient */}
        <linearGradient id={shieldGradId} x1="50" y1="16" x2="50" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#312E81" stopOpacity="0.95" />
        </linearGradient>

        {/* Left Tome Wing Gradient */}
        <linearGradient id={bookLeftGradId} x1="24" y1="36" x2="48" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0E7FF" />
          <stop offset="60%" stopColor="#C7D2FE" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>

        {/* Right Tome Wing Gradient */}
        <linearGradient id={bookRightGradId} x1="76" y1="36" x2="52" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#E0E7FF" />
          <stop offset="100%" stopColor="#A5B4FC" />
        </linearGradient>

        {/* Vault Dial Ring Gradient */}
        <linearGradient id={vaultRingGradId} x1="28" y1="28" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>

        {/* AI Golden Spark Gradient */}
        <linearGradient id={starGradId} x1="42" y1="38" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="35%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Glow Filter */}
        <filter id={glowFilterId} x="20" y="20" width="60" height="60" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Squircle Inner Highlight */}
        <linearGradient id={innerShadowId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* 1. App Icon Rounded Squircle Base */}
      <rect width="100" height="100" rx="24" fill={`url(#${bgGradId})`} />
      <rect
        width="98"
        height="98"
        x="1"
        y="1"
        rx="23"
        fill="none"
        stroke={`url(#${innerShadowId})`}
        strokeWidth="1.5"
      />

      {/* Ambient Radial Depth Flare */}
      <circle cx="50" cy="46" r="32" fill="#6366F1" fillOpacity="0.2" filter={`url(#${glowFilterId})`} />

      {/* 2. Outer Vault Shield Rim */}
      <path
        d="M50 16L78 26V50C78 66 65 79 50 84C35 79 22 66 22 50V26L50 16Z"
        fill={`url(#${shieldGradId})`}
        stroke="#818CF8"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* 3. Open Academic Tome (Left Wing & Right Wing) */}
      {/* Left Wing */}
      <path
        d="M50 63C42 59 34 59 28 62V41C34 38 42 38 50 42V63Z"
        fill={`url(#${bookLeftGradId})`}
        fillOpacity="0.9"
      />
      {/* Right Wing */}
      <path
        d="M50 63C58 59 66 59 72 62V41C66 38 58 38 50 42V63Z"
        fill={`url(#${bookRightGradId})`}
        fillOpacity="0.95"
      />
      {/* Spine line */}
      <line x1="50" y1="41" x2="50" y2="64" stroke="#4338CA" strokeWidth="1.5" strokeLinecap="round" />

      {/* 4. The Digital Vault Safe Ring & Detents */}
      <circle
        cx="50"
        cy="47"
        r="17"
        fill="#1E1B4B"
        fillOpacity="0.9"
        stroke={`url(#${vaultRingGradId})`}
        strokeWidth="2.2"
      />
      {/* Vault Radial Detents */}
      <circle cx="50" cy="32.5" r="1.2" fill="#38BDF8" />
      <circle cx="50" cy="61.5" r="1.2" fill="#818CF8" />
      <circle cx="35.5" cy="47" r="1.2" fill="#38BDF8" />
      <circle cx="64.5" cy="47" r="1.2" fill="#C084FC" />
      <circle cx="39.5" cy="36.5" r="0.9" fill="#818CF8" />
      <circle cx="60.5" cy="36.5" r="0.9" fill="#38BDF8" />
      <circle cx="39.5" cy="57.5" r="0.9" fill="#818CF8" />
      <circle cx="60.5" cy="57.5" r="0.9" fill="#C084FC" />

      {/* 5. Keyhole Aperture Base */}
      <path
        d="M48 50.5L46.5 56H53.5L52 50.5C53.2 49.8 54 48.5 54 47C54 44.8 52.2 43 50 43C47.8 43 46 44.8 46 47C46 48.5 46.8 49.8 48 50.5Z"
        fill="#0F172A"
        fillOpacity="0.75"
      />

      {/* 6. AI Intelligence Spark (4-Point Diamond Star at the Center) */}
      <g filter={`url(#${glowFilterId})`}>
        <path
          d="M50 37C50.5 42 52 44.5 57 45C52 45.5 50.5 48 50 53C49.5 48 48 45.5 43 45C48 44.5 49.5 42 50 37Z"
          fill={`url(#${starGradId})`}
        />
        {/* Core highlight dot */}
        <circle cx="50" cy="45" r="1.6" fill="#FFFFFF" />
      </g>

      {/* 7. Constellation Accent Sparks */}
      {/* Top Right micro spark */}
      <path
        d="M66 28C66.3 30 67 31 69 31.2C67 31.5 66.3 32.5 66 34.5C65.7 32.5 65 31.5 63 31.2C65 31 65.7 30 66 28Z"
        fill="#38BDF8"
      />
      {/* Left bottom micro dot */}
      <circle cx="30" cy="33" r="1.2" fill="#FDE047" fillOpacity="0.9" />
    </svg>
  );
};

/**
 * Full Brand Lockup with Typography & AI Badge
 */
export const StudyVaultBrandLockup: React.FC<{
  size?: number;
  subtitle?: string;
  className?: string;
}> = ({ size = 38, subtitle = "Learn • Plan • Grow", className = "" }) => {
  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      <div className="relative shrink-0 transition-transform duration-200 hover:scale-105">
        <StudyVaultLogoMark size={size} className="rounded-2xl shadow-sm" />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center space-x-1.5">
          <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
            StudyVault
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-black tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-md leading-none">
            AI
          </span>
        </div>
        {subtitle && (
          <span className="text-[11px] font-medium text-slate-400 tracking-wider block mt-1">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
