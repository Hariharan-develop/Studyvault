import React from "react";

interface ProfileAvatarProps {
  photoURL?: string | null;
  displayName?: string;
  size?: number;
  className?: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  photoURL,
  displayName = "Hariharan",
  size = 36,
  className = "",
}) => {
  if (photoURL) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-full overflow-hidden ring-2 ring-amber-400/40 shrink-0 shadow-xs ${className}`}
      >
        <img
          src={photoURL}
          alt={displayName}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  // Exact artistic portrait matching the reference avatar image
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full overflow-hidden ring-2 ring-amber-500/30 bg-[#0B0C10] shrink-0 shadow-xs flex items-center justify-center ${className}`}
      title={displayName}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="amberGlow" cx="55%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#B45309" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#78350F" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0B0904" stopOpacity="1" />
          </radialGradient>
          <linearGradient id="hoodGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="40%" stopColor="#92400E" />
            <stop offset="80%" stopColor="#451A03" />
            <stop offset="100%" stopColor="#1C0D02" />
          </linearGradient>
          <linearGradient id="faceGlow" x1="0.3" y1="0.2" x2="0.8" y2="0.9">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="80%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
        </defs>

        {/* Dark Background */}
        <rect width="100" height="100" fill="#0D0904" />
        <circle cx="50" cy="50" r="48" fill="url(#amberGlow)" opacity="0.6" />

        {/* Hood Shadow & Texture */}
        <path
          d="M 18 96 C 18 52 30 20 52 14 C 74 20 84 50 84 96 Z"
          fill="url(#hoodGrad)"
        />

        {/* Hood Opening & Inner Shadow */}
        <path
          d="M 28 92 C 28 58 36 34 52 30 C 68 34 74 58 74 92 Z"
          fill="#1C0D02"
        />

        {/* Face Illuminated in Golden / Amber Glow */}
        <ellipse cx="54" cy="54" rx="14" ry="18" fill="url(#faceGlow)" />
        {/* Deep facial features silhouette */}
        <path
          d="M 44 48 C 48 46 54 48 54 52 C 54 58 56 60 58 64 C 52 66 48 62 44 56 Z"
          fill="#451A03"
          opacity="0.75"
        />
        {/* Brow and nose shadow */}
        <path
          d="M 52 48 L 56 55 L 53 58 Z"
          fill="#78350F"
          opacity="0.9"
        />
        {/* Eye ember gleam */}
        <circle cx="55" cy="50" r="1.5" fill="#FEF3C7" />

        {/* Hood Folds & Rim Lighting */}
        <path
          d="M 32 32 C 42 22 62 24 72 34"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M 22 64 C 24 48 30 38 36 32"
          stroke="#D97706"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
    </div>
  );
};
