//src>components>SoVLogo.tsx
import React from 'react';

export default function SoVLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient
          id="svGradientDominant"
          x1="10%"
          y1="90%"
          x2="95%"
          y2="5%"
        >
          <stop offset="0%" stopColor="#0038FF" />
          <stop offset="45%" stopColor="#0094FF" />
          <stop offset="100%" stopColor="#00F0FF" />
        </linearGradient>
      </defs>

      <path
        d="M 45,230 C 15,230 15,255 35,255 C 55,255 55,280 25,280"
        stroke="#FFFFFF"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="95" cy="255" r="24" stroke="#FFFFFF" strokeWidth="8" />
      <circle cx="95" cy="255" r="8" stroke="#FFFFFF" strokeWidth="5" />

      <path
        d="M 144,265 C 172,265 202,325 226,356 C 230,361 238,361 242,356 L 346,182 M 348,178 L 258,202 M 348,178 L 348,268"
        stroke="url(#svGradientDominant)"
        strokeWidth="62"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}