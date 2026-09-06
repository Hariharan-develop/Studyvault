import React from "react";

interface StudentHeroGraphicProps {
  className?: string;
}

export const StudentHeroGraphic: React.FC<StudentHeroGraphicProps> = ({ className = "w-48 h-48 md:w-56 md:h-56" }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-300/25 via-purple-300/20 to-sky-200/30 rounded-full blur-2xl scale-95" />

      <svg
        viewBox="0 0 240 220"
        className="w-full h-full relative z-10 drop-shadow-lg overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Skin Gradients */}
          <linearGradient id="studentSkin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFDFC7" />
            <stop offset="60%" stopColor="#F9CDB0" />
            <stop offset="100%" stopColor="#F3B997" />
          </linearGradient>

          <linearGradient id="studentSkinShadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F3B997" />
            <stop offset="100%" stopColor="#E2A380" />
          </linearGradient>

          {/* Hair Gradients */}
          <linearGradient id="studentHair" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2D3748" />
            <stop offset="40%" stopColor="#1A202C" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          <linearGradient id="studentHairHighlight" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4A5568" />
            <stop offset="100%" stopColor="#2D3748" />
          </linearGradient>

          {/* Hoodie Gradients */}
          <linearGradient id="studentHoodie" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="45%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#3730A3" />
          </linearGradient>

          <linearGradient id="studentHoodieDeep" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4338CA" />
            <stop offset="100%" stopColor="#312E81" />
          </linearGradient>

          {/* Laptop Gradients */}
          <linearGradient id="studentLaptopLid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="60%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          <linearGradient id="studentLaptopEdge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* SV Badge Gradient */}
          <linearGradient id="svBadge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>

          {/* Star Gradient */}
          <linearGradient id="yellowStar" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>

          {/* Sparkle Gradient */}
          <linearGradient id="sparkleGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="50%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#7DD3FC" />
          </linearGradient>

          {/* Drop Shadow Filter */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Floating Sparkle / Origami Diamond to the Upper Right */}
        <g transform="translate(170, 48)">
          <path
            d="M 0 -14 C 1 -5 5 -1 14 0 C 5 1 1 5 0 14 C -1 5 -5 1 -14 0 C -5 -1 -1 -5 0 -14 Z"
            fill="url(#sparkleGrad)"
            filter="url(#softGlow)"
          />
          {/* Internal facet highlight */}
          <path
            d="M 0 -14 L 0 0 L 14 0 Z"
            fill="#FFFFFF"
            opacity="0.6"
          />
          <path
            d="M 0 14 L 0 0 L -14 0 Z"
            fill="#38BDF8"
            opacity="0.35"
          />
          <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
        </g>

        {/* Additional tiny sparkle */}
        <g transform="translate(196, 75)">
          <path
            d="M 0 -6 C 0.5 -2 2 -0.5 6 0 C 2 0.5 0.5 2 0 6 C -0.5 2 -2 0.5 -6 0 C -2 -0.5 -0.5 -2 0 -6 Z"
            fill="#BAE6FD"
            opacity="0.8"
          />
        </g>

        {/* Student Body - Torso with Purple Hoodie */}
        <g id="student-body">
          {/* Main Hoodie Torso */}
          <path
            d="M 60 215 C 60 160 72 138 108 135 C 122 135 138 135 152 135 C 188 138 200 160 200 215 Z"
            fill="url(#studentHoodie)"
          />

          {/* Hoodie Left/Right Shading for 3D Volume */}
          <path
            d="M 60 215 C 60 165 72 142 98 136 C 88 152 82 178 80 215 Z"
            fill="url(#studentHoodieDeep)"
            opacity="0.45"
          />
          <path
            d="M 200 215 C 200 165 188 142 162 136 C 172 152 178 178 180 215 Z"
            fill="url(#studentHoodieDeep)"
            opacity="0.45"
          />

          {/* Hoodie Collar / Hood Fold */}
          <path
            d="M 98 132 C 108 148 152 148 162 132 C 152 125 108 125 98 132 Z"
            fill="url(#studentHoodieDeep)"
          />

          {/* White Hoodie Drawstrings */}
          <path
            d="M 118 138 C 117 150 115 162 114 172"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <rect x="112.5" y="172" width="3" height="5" rx="1.5" fill="#E2E8F0" />

          <path
            d="M 142 138 C 143 150 145 162 146 172"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <rect x="144.5" y="172" width="3" height="5" rx="1.5" fill="#E2E8F0" />

          {/* Yellow Star Emblem on Chest (Student's Right Chest / Viewer's Left) */}
          <g transform="translate(98, 172)">
            <path
              d="M 0 -8 C 0.8 -2.5 2.5 -0.8 8 0 C 2.5 0.8 0.8 2.5 0 8 C -0.8 2.5 -2.5 0.8 -8 0 C -2.5 -0.8 -0.8 -2.5 0 -8 Z"
              fill="url(#yellowStar)"
              filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.2))"
            />
            <circle cx="0" cy="0" r="1.5" fill="#FEF08A" />
          </g>
        </g>

        {/* Neck */}
        <path
          d="M 118 116 L 118 136 C 122 138 138 138 142 136 L 142 116 Z"
          fill="url(#studentSkinShadow)"
        />

        {/* Head and Face */}
        <g id="student-head">
          {/* Ears */}
          <ellipse cx="94" cy="92" rx="7" ry="9" fill="url(#studentSkin)" />
          <ellipse cx="94" cy="92" rx="4" ry="5.5" fill="url(#studentSkinShadow)" />

          <ellipse cx="166" cy="92" rx="7" ry="9" fill="url(#studentSkin)" />
          <ellipse cx="166" cy="92" rx="4" ry="5.5" fill="url(#studentSkinShadow)" />

          {/* Face Oval */}
          <ellipse cx="130" cy="90" rx="33" ry="36" fill="url(#studentSkin)" />

          {/* Chin refinement */}
          <path
            d="M 104 90 C 104 116 116 126 130 126 C 144 126 156 116 156 90 Z"
            fill="url(#studentSkin)"
          />

          {/* Soft Cheeks Blush */}
          <ellipse cx="110" cy="97" rx="6" ry="4" fill="#F43F5E" opacity="0.22" />
          <ellipse cx="150" cy="97" rx="6" ry="4" fill="#F43F5E" opacity="0.22" />

          {/* Cute Nose */}
          <path
            d="M 128 89 C 129 93 131 93 132 89"
            stroke="#E2A380"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Friendly Smile */}
          <path
            d="M 121 99 C 125 106 135 106 139 99"
            stroke="#0F172A"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Big Expressive Cartoon Eyes */}
          {/* Left Eye */}
          <g transform="translate(114, 84)">
            <ellipse cx="0" cy="0" rx="4.5" ry="6" fill="#0F172A" />
            <circle cx="-1.5" cy="-2" r="1.8" fill="#FFFFFF" />
            <circle cx="1.5" cy="2" r="0.8" fill="#FFFFFF" />
            {/* Eyelash / brow */}
            <path
              d="M -6 -8 C -4 -11 3 -11 6 -8"
              stroke="#0F172A"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Right Eye */}
          <g transform="translate(146, 84)">
            <ellipse cx="0" cy="0" rx="4.5" ry="6" fill="#0F172A" />
            <circle cx="-1.5" cy="-2" r="1.8" fill="#FFFFFF" />
            <circle cx="1.5" cy="2" r="0.8" fill="#FFFFFF" />
            {/* Eyelash / brow */}
            <path
              d="M -6 -8 C -3 -11 4 -11 6 -8"
              stroke="#0F172A"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Volumetric Stylized Wavy Black Hair */}
          <g id="student-hair">
            {/* Back Hair volume */}
            <path
              d="M 94 82 C 90 56 102 36 130 36 C 158 36 170 56 166 82 C 160 62 148 50 130 50 C 112 50 100 62 94 82 Z"
              fill="url(#studentHair)"
            />

            {/* Main Hair Mass */}
            <path
              d="M 96 82 C 93 60 100 42 124 38 C 142 35 162 44 167 64 C 172 76 168 90 166 92 C 163 76 156 70 148 68 C 138 66 132 74 122 70 C 114 66 108 76 96 82 Z"
              fill="url(#studentHair)"
            />

            {/* Front Bangs & Wave Tuft */}
            <path
              d="M 104 68 C 112 55 125 54 135 60 C 145 66 156 60 162 70 C 155 64 146 64 140 70 C 132 64 120 64 104 68 Z"
              fill="url(#studentHairHighlight)"
            />

            {/* Wave Strands Top Volume */}
            <path
              d="M 115 42 C 122 36 138 34 148 42 C 140 40 126 38 115 42 Z"
              fill="url(#studentHairHighlight)"
              opacity="0.8"
            />

            {/* Sideburns */}
            <path
              d="M 98 80 C 97 86 98 92 100 95 C 100 90 101 84 103 80 Z"
              fill="url(#studentHair)"
            />
            <path
              d="M 162 80 C 163 86 162 92 160 95 C 160 90 159 84 157 80 Z"
              fill="url(#studentHair)"
            />
          </g>
        </g>

        {/* Laptop Held at Desk */}
        <g id="student-laptop" transform="translate(0, 10)">
          {/* Glow from screen onto student chest */}
          <ellipse cx="160" cy="170" rx="45" ry="16" fill="#C7D2FE" opacity="0.18" />

          {/* Laptop Lid (Tilted back facing viewer) */}
          <polygon
            points="140,145 224,152 212,205 130,198"
            fill="url(#studentLaptopLid)"
            stroke="url(#studentLaptopEdge)"
            strokeWidth="1.5"
            filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
          />

          {/* Laptop Top Bevel Edge Highlight */}
          <line
            x1="140"
            y1="145"
            x2="224"
            y2="152"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* SV Circular Badge in Center of Lid */}
          <g transform="translate(177, 175) rotate(5)">
            {/* Outer soft glow ring */}
            <circle cx="0" cy="0" r="14.5" fill="#4F46E5" opacity="0.3" />
            {/* Main circular purple badge */}
            <circle cx="0" cy="0" r="13" fill="url(#svBadge)" stroke="#818CF8" strokeWidth="0.8" />
            {/* SV Text */}
            <text
              x="0"
              y="4.5"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="10"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="-0.5px"
              fontStyle="italic"
            >
              SV
            </text>
          </g>

          {/* Student Hands Resting On / Holding the Laptop Base */}
          {/* Left Hand */}
          <path
            d="M 125 188 C 122 186 118 190 120 196 C 122 202 128 205 136 200 C 138 194 135 188 125 188 Z"
            fill="url(#studentSkin)"
          />
          {/* Right Hand */}
          <path
            d="M 210 196 C 214 194 218 198 217 204 C 215 210 208 212 202 208 C 200 202 203 196 210 196 Z"
            fill="url(#studentSkin)"
          />
        </g>
      </svg>
    </div>
  );
};
