import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | undefined | null, compact = false) {
  if (value === null || value === undefined) {
    return "Rp 0";
  }
  
  if (compact) {
    return new Intl.NumberFormat('id-ID', {
      notation: "compact",
      compactDisplay: "short",
    }).format(value);
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Sanitizes a filename by removing special characters that are often problematic
 * in URLs or file systems. Leaves dots, hyphens, and underscores.
 * @param filename The original filename.
 * @returns A sanitized filename.
 */
export function sanitizeFileName(filename: string): string {
  // Replace any character that is not a letter, number, dot, hyphen, or underscore with an underscore.
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}
