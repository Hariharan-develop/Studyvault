import React from "react";

interface GraduationCap3DIconProps {
  className?: string;
  size?: number;
}

export const GraduationCap3DIcon: React.FC<GraduationCap3DIconProps> = ({
  className = "",
  size = 48,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md overflow-visible ${className}`}
    >
      <defs>
        {/* Diamond Top Cap Gradients */}
        <linearGradient id="capTopGrad" x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        <linearGradient id="capEdgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>

        {/* Cap Skull Underneath */}
        <linearGradient id="capSkullGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>

        {/* Tassel Gradients */}
        <linearGradient id="tasselGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>

      {/* Cap Skull (under the diamond plate) */}
      <path
        d="M 20 28 C 20 38 44 38 44 28 C 44 38 44 42 32 44 C 20 42 20 38 20 28 Z"
        fill="url(#capSkullGrad)"
        filter="drop-shadow(0px 2px 3px rgba(15, 23, 42, 0.25))"
      />
      {/* Cap Rim Band */}
      <path
        d="M 21 34 C 27 37 37 37 43 34"
        stroke="#60A5FA"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Diamond Cap Plate Bevel Edge (Depth) */}
      <polygon
        points="32,15 58,26 32,37 6,26"
        fill="url(#capEdgeGrad)"
        transform="translate(0, 2)"
      />

      {/* Main Diamond Cap Plate */}
      <polygon
        points="32,14 58,25 32,36 6,25"
        fill="url(#capTopGrad)"
      />

      {/* Highlight on top diamond edge */}
      <line
        x1="6"
        y1="25"
        x2="32"
        y2="14"
        stroke="#93C5FD"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Center Cap Button */}
      <ellipse cx="32" cy="25" rx="3" ry="2.2" fill="#DBEAFE" />
      <ellipse cx="32" cy="24.5" rx="2" ry="1.5" fill="#2563EB" />

      {/* Tassel Cord draping to the right */}
      <path
        d="M 32 25 C 38 27 48 29 50 34"
        stroke="url(#tasselGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Tassel Ring / Band */}
      <ellipse cx="50" cy="35" rx="1.8" ry="1.2" fill="#DBEAFE" />

      {/* Tassel Fringe / Pom-pom */}
      <path
        d="M 48 36 C 47 43 49 46 51 46 C 53 46 54 43 53 36 Z"
        fill="url(#tasselGrad)"
        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))"
      />
    </svg>
  );
};
