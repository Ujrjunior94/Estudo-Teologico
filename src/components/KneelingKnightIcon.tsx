import React from 'react';

interface KneelingKnightIconProps {
  size?: number;
  className?: string;
}

export const KneelingKnightIcon: React.FC<KneelingKnightIconProps> = ({ size = 48, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Definitions for Gradients and Filters */}
      <defs>
        {/* Background Gradient */}
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>

        {/* Emerald Glow */}
        <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Gold Accent for Armor */}
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Metallic Plate Armor Gradient */}
        <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Drop shadow filter for the knight to stand out */}
        <filter id="knightShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* 1. Outer Circle Badge with Gold Border */}
      <circle cx="50" cy="50" r="46" fill="url(#bgGrad)" stroke="url(#goldGrad)" strokeWidth="3" />
      <circle cx="50" cy="50" r="42" stroke="url(#emeraldGrad)" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3" />

      {/* 2. Kneeling Soldier / Knight Silhouette with Detailed Armor Plating */}
      <g filter="url(#knightShadow)">
        {/* Helmet Crest/Plume (Emerald Power) */}
        <path
          d="M48 14 C48 8, 38 12, 34 18 C38 18, 44 18, 48 14 Z"
          fill="url(#emeraldGrad)"
          stroke="#047857"
          strokeWidth="0.5"
        />
        <path
          d="M48 14 C52 8, 62 12, 66 18 C62 18, 56 18, 48 14 Z"
          fill="url(#emeraldGrad)"
          stroke="#047857"
          strokeWidth="0.5"
        />

        {/* Knight Helmet */}
        {/* Dome */}
        <path
          d="M38 24 C38 17, 62 17, 62 24 C62 28, 60 31, 50 31 C40 31, 38 28, 38 24 Z"
          fill="url(#metalGrad)"
          stroke="#1e293b"
          strokeWidth="1.5"
        />
        {/* Visor/Eye Slit (Glowing Gold/Emerald) */}
        <path
          d="M43 23 H57 V25 H43 Z"
          fill="url(#goldGrad)"
        />
        {/* Helmet Gorget/Neck Plate */}
        <path
          d="M42 30 L40 35 L50 38 L60 35 L58 30 Z"
          fill="url(#metalGrad)"
          stroke="#1e293b"
          strokeWidth="1"
        />

        {/* Left and Right Pauldrons (Shoulders) */}
        <path
          d="M28 36 C28 32, 40 32, 41 37 L36 48 L28 41 Z"
          fill="url(#metalGrad)"
          stroke="#1e293b"
          strokeWidth="1"
        />
        <path
          d="M72 36 C72 32, 60 32, 59 37 L64 48 L72 41 Z"
          fill="url(#metalGrad)"
          stroke="#1e293b"
          strokeWidth="1"
        />

        {/* Cuirass / Chest Plate (Engraved with a Gold Cross) */}
        <path
          d="M40 36 H60 L57 54 H43 Z"
          fill="url(#metalGrad)"
          stroke="#1e293b"
          strokeWidth="1.5"
        />
        {/* Cross on Chestplate */}
        <path
          d="M48 40 H52 V50 H48 Z"
          fill="url(#goldGrad)"
        />
        <path
          d="M45 43 H55 V47 H45 Z"
          fill="url(#goldGrad)"
        />

        {/* Kneeling Legs (Medieval Greaves & Solerets) */}
        {/* Right Knee Bent Upwards */}
        <path
          d="M57 54 L66 62 L64 74 L54 74 L52 64 L57 54 Z"
          fill="url(#metalGrad)"
          stroke="#1e293b"
          strokeWidth="1.2"
        />
        {/* Left Knee Down on the ground */}
        <path
          d="M43 54 L32 64 L22 72 C18 75, 24 80, 28 80 L44 80 L43 68 L43 54 Z"
          fill="url(#metalGrad)"
          stroke="#1e293b"
          strokeWidth="1.2"
        />

        {/* Cape/Cloak draping behind the knight */}
        <path
          d="M28 36 L18 68 C16 75, 22 78, 26 78 C30 72, 32 62, 34 50 Z"
          fill="#1e293b"
          opacity="0.85"
          stroke="url(#emeraldGrad)"
          strokeWidth="1"
        />
        <path
          d="M72 36 L82 68 C84 75, 78 78, 74 78 C70 72, 68 62, 66 50 Z"
          fill="#1e293b"
          opacity="0.85"
          stroke="url(#emeraldGrad)"
          strokeWidth="1"
        />

        {/* Armored Gauntlets holding the Sword */}
        <circle cx="50" cy="50" r="4" fill="url(#metalGrad)" stroke="#1e293b" strokeWidth="1" />

        {/* 3. The Sword (Holy Cross design) */}
        {/* Blade (pointing down/planted in the ground) */}
        <path
          d="M49 50 H51 L50.5 86 H49.5 Z"
          fill="url(#metalGrad)"
          stroke="#475569"
          strokeWidth="0.8"
        />
        {/* Crossguard */}
        <path
          d="M41 48 H59 V50 H41 Z"
          fill="url(#goldGrad)"
          stroke="#92400e"
          strokeWidth="1"
        />
        {/* Hilt / Grip */}
        <path
          d="M49 42 H51 V48 H49 Z"
          fill="#78350f"
        />
        {/* Pommel (Jewelled sphere) */}
        <circle cx="50" cy="41" r="2.5" fill="url(#goldGrad)" stroke="#92400e" strokeWidth="0.5" />
      </g>

      {/* Divine light ray effect centered behind the knight's head */}
      <circle cx="50" cy="24" r="12" stroke="url(#goldGrad)" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="2 4" />
    </svg>
  );
};
