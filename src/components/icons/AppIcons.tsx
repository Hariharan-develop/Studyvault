import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  strokeWidth?: number | string;
}

/** 1. Bar Chart Icon */
export const BarChartIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="4" y1="20" x2="4" y2="10" />
    <line x1="9.5" y1="20" x2="9.5" y2="4" />
    <line x1="15" y1="20" x2="15" y2="13" />
    <line x1="20.5" y1="20" x2="20.5" y2="6" />
  </svg>
);

/** 2. Chat Icon */
export const ChatIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="8" y1="9" x2="16" y2="9" />
    <line x1="8" y1="13" x2="13" y2="13" />
  </svg>
);

/** 3. Checkbox Checked Icon */
export const CheckboxCheckedIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="4.5" />
    <path d="M8.5 12.5l2.5 2.5 4.5-4.5" />
  </svg>
);

/** 4. Checkbox Empty Icon */
export const CheckboxEmptyIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="4.5" />
  </svg>
);

/** 5. Chevron Down Icon */
export const ChevronDownIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/** 6. Clock Icon */
export const ClockIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

/** 7. Dashboard Icon */
export const DashboardIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="3" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="3" width="7" height="7" rx="2" />
    <rect x="3" y="14" width="7" height="7" rx="2" />
    <rect x="14" y="14" width="7" height="7" rx="2" />
  </svg>
);

/** 8. Document Icon */
export const DocumentIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="8" y1="15" x2="16" y2="15" />
    <line x1="8" y1="18" x2="13" y2="18" />
  </svg>
);

/** 9. Graduation Cap Icon */
export const GraduationCapIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
  </svg>
);

/** 10. Notes Icon */
export const NotesIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="8" y1="16" x2="14" y2="16" />
  </svg>
);

/** 11. Quiz Brain Icon */
export const QuizBrainIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Center stem */}
    <line x1="12" y1="4" x2="12" y2="20" />
    {/* Left hemisphere lobes */}
    <path d="M12 4.5c-2.2 0-3.8 1.2-4.2 2.8a3.2 3.2 0 0 0-2 4 3.2 3.2 0 0 0 0 4 3.5 3.5 0 0 0 2.5 4c1.1 0 2.6-.5 3.7-1.5" />
    {/* Right hemisphere lobes */}
    <path d="M12 4.5c2.2 0 3.8 1.2 4.2 2.8a3.2 3.2 0 0 1 2 4 3.2 3.2 0 0 1 0 4 3.5 3.5 0 0 1-2.5 4c-1.1 0-2.6-.5-3.7-1.5" />
    {/* Internal brain wrinkles */}
    <path d="M8.5 12h3.5" />
    <path d="M12 12h3.5" />
  </svg>
);

/** 12. Reflection Book Icon */
export const ReflectionBookIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 5c-3-2-7-2-9 0v14c2-2 6-2 9 0" />
    <path d="M12 5c3-2 7-2 9 0v14c-2-2-6-2-9 0" />
    <line x1="12" y1="5" x2="12" y2="19" />
  </svg>
);

/** 13. Search Icon */
export const SearchIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="21" y2="21" />
  </svg>
);

/** 14. Star Icon */
export const StarIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/** 15. Study Session Icon */
export const StudySessionIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="8" y1="9" x2="16" y2="9" />
    <line x1="8" y1="13" x2="13" y2="13" />
  </svg>
);

/** 16. StudyVault Logo Icon - Unique bespoke vector brand mark */
export const StudyVaultLogoIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 select-none ${className}`}
    {...props}
  >
    <defs>
      <linearGradient id="sv-icon-bg" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4F46E5" />
        <stop offset="50%" stopColor="#3730A3" />
        <stop offset="100%" stopColor="#1E1B4B" />
      </linearGradient>
      <linearGradient id="sv-icon-shield" x1="50" y1="16" x2="50" y2="84" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6366F1" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#312E81" stopOpacity="0.95" />
      </linearGradient>
      <linearGradient id="sv-icon-wing-l" x1="28" y1="40" x2="50" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E0E7FF" />
        <stop offset="100%" stopColor="#818CF8" />
      </linearGradient>
      <linearGradient id="sv-icon-wing-r" x1="72" y1="40" x2="50" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#A5B4FC" />
      </linearGradient>
      <linearGradient id="sv-icon-dial" x1="32" y1="32" x2="68" y2="68" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#818CF8" />
      </linearGradient>
      <linearGradient id="sv-icon-star" x1="44" y1="40" x2="56" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="40%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>

    {/* App Icon Container */}
    <rect width="100" height="100" rx="24" fill="url(#sv-icon-bg)" />
    <rect width="98" height="98" x="1" y="1" rx="23" stroke="#818CF8" strokeOpacity="0.3" strokeWidth="1.5" fill="none" />

    {/* Shield Silhouette */}
    <path
      d="M50 16L78 26V50C78 66 65 79 50 84C35 79 22 66 22 50V26L50 16Z"
      fill="url(#sv-icon-shield)"
      stroke="#818CF8"
      strokeWidth="1.5"
    />

    {/* Open Tome Wings */}
    <path d="M50 63C42 59 34 59 28 62V41C34 38 42 38 50 42V63Z" fill="url(#sv-icon-wing-l)" />
    <path d="M50 63C58 59 66 59 72 62V41C66 38 58 38 50 42V63Z" fill="url(#sv-icon-wing-r)" />
    <line x1="50" y1="41" x2="50" y2="64" stroke="#4338CA" strokeWidth="1.5" strokeLinecap="round" />

    {/* Vault Dial */}
    <circle cx="50" cy="47" r="17" fill="#1E1B4B" fillOpacity="0.9" stroke="url(#sv-icon-dial)" strokeWidth="2" />
    <circle cx="50" cy="33" r="1.2" fill="#38BDF8" />
    <circle cx="50" cy="61" r="1.2" fill="#818CF8" />
    <circle cx="36" cy="47" r="1.2" fill="#38BDF8" />
    <circle cx="64" cy="47" r="1.2" fill="#C084FC" />

    {/* AI 4-Point Golden Star */}
    <path
      d="M50 37C50.5 42 52 44.5 57 45C52 45.5 50.5 48 50 53C49.5 48 48 45.5 43 45C48 44.5 49.5 42 50 37Z"
      fill="url(#sv-icon-star)"
    />
    <circle cx="50" cy="45" r="1.5" fill="#FFFFFF" />

    {/* Constellation Spark Accent */}
    <path d="M66 28C66.3 30 67 31 69 31.2C67 31.5 66.3 32.5 66 34.5C65.7 32.5 65 31.5 63 31.2C65 31 65.7 30 66 28Z" fill="#38BDF8" />
  </svg>
);

/** 17. Target Icon */
export const TargetIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <path d="M19 5l-4 4M19 5h-4M19 5v4" />
  </svg>
);

/** 18. Trending Up Icon */
export const TrendingUpIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

/** 19. Vault Icon */
export const VaultIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
    <rect x="2" y="3" width="20" height="5" rx="1.5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

/** 20. Bell Icon */
export const BellIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

/** 21. Calendar Icon */
export const CalendarIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="3" y="4" width="18" height="18" rx="3" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="8" cy="14" r="1" fill="currentColor" />
    <circle cx="12" cy="14" r="1" fill="currentColor" />
    <circle cx="16" cy="14" r="1" fill="currentColor" />
    <circle cx="8" cy="18" r="1" fill="currentColor" />
    <circle cx="12" cy="18" r="1" fill="currentColor" />
    <circle cx="16" cy="18" r="1" fill="currentColor" />
  </svg>
);

/** 22. Lightbulb Icon */
export const LightbulbIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M9 18h6" />
    <path d="M10 21h4" />
    <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 2.5 6h9c1-1.5 2.5-3.5 2.5-6a7 7 0 0 0-7-7z" />
  </svg>
);

/** 23. Logout Icon */
export const LogoutIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/** 24. Quiz Badge Icon */
export const QuizBadgeIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    <line x1="12" y1="9.5" x2="12" y2="14.5" />
    <line x1="9.5" y1="12" x2="14.5" y2="12" />
  </svg>
);

/** 25. Refresh Icon */
export const RefreshIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

/** 26. Subjects Icon */
export const SubjectsIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
  </svg>
);

/** Alias for StudyVaultLogoIcon */
export const LogoIcon = StudyVaultLogoIcon;

/** Action & Utility Icons */
export const PlusIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const BotIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="3" y="11" width="18" height="10" rx="3" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16.01" />
    <line x1="16" y1="16" x2="16" y2="16.01" />
  </svg>
);

export const SendIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export const SaveIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  strokeWidth = 2.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);


