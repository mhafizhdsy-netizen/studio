
import React from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-8 w-8', className)}
    >
      <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
      <g transform="translate(6 6)">
        <path
          d="M13.5 1H6.5C5.94772 1 5.5 1.44772 5.5 2V19C5.5 19.5523 5.94772 20 6.5 20H13.5C14.0523 20 14.5 19.5523 14.5 19V2C14.5 1.44772 14.0523 1 13.5 1Z"
          fill="hsl(var(--primary-foreground))"
          fillOpacity="0.1"
        />
        <path
          d="M13.5 1H6.5C5.94772 1 5.5 1.44772 5.5 2V19C5.5 19.5523 5.94772 20 6.5 20H13.5C14.0523 20 14.5 19.5523 14.5 19V2C14.5 1.44772 14.0523 1 13.5 1Z"
          stroke="hsl(var(--primary-foreground))"
          strokeOpacity="0.5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 13.5H11M10 12.5V14.5M6.5 7.5H13.5"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 17.5C10.8284 17.5 11.5 16.8284 11.5 16C11.5 15.1716 10.8284 14.5 10 14.5C9.17157 14.5 8.5 15.1716 8.5 16C8.5 16.8284 9.17157 17.5 10 17.5Z"
          fill="hsl(var(--accent))"
        />
      </g>
      <defs>
        <linearGradient
          id="logo-gradient"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="hsl(var(--primary))" />
          <stop offset="1" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
    </svg>
  );
}
