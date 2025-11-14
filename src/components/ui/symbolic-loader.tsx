"use client";

import { cn } from "@/lib/utils";

interface SymbolicLoaderProps {
  className?: string;
}

export function SymbolicLoader({ className }: SymbolicLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
        <svg
            width="48"
            height="48"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12"
        >
            <path 
                d="M9 22V15C9 14.4477 9.44772 14 10 14H15L17 18H22C22.5523 18 23 17.5523 23 17V10" 
                stroke="hsl(var(--primary))" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="symbol-loader-path"
            />
        </svg>
        <p className="text-sm text-muted-foreground animate-pulse">Memuat...</p>
    </div>
  );
}
