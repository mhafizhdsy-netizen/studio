"use client";

import { cn } from "@/lib/utils";

interface InfinityLoaderProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function InfinityLoader({ className, ...props }: InfinityLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
        <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 100"
        className={cn("h-12 w-24", className)}
        {...props}
        >
        <path
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            d="M50,50 A25,25 0 1,0 100,50 A25,25 0 1,1 150,50"
            className="infinity-loader-path"
        />
        </svg>
        <p className="text-sm text-muted-foreground animate-pulse">Memuat...</p>
    </div>
  );
}
