
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
        <rect width="32" height="32" rx="8" fill="url(#logo-gradient-symbolic)" />
        <path 
            d="M9 22V15C9 14.4477 9.44772 14 10 14H15" 
            stroke="hsl(var(--primary-foreground))" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
        <path 
            d="M23 10V17C23 17.5523 22.5523 18 22 18H17" 
            stroke="hsl(var(--primary-foreground))" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
         <path 
            d="M15 14L17 18" 
            stroke="hsl(var(--primary-foreground))" 
            strokeOpacity="0.5"
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
        <defs>
            <linearGradient id="logo-gradient-symbolic" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="hsl(var(--primary))"/>
                <stop offset="1" stopColor="hsl(var(--primary) / 0.7)"/>
            </linearGradient>
        </defs>
    </svg>
  );
}
