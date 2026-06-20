import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatPct(n: number | undefined | null, showPlus = true): string {
  if (n == null || isNaN(n)) return "0%";
  const sign = showPlus && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#e1306c",
  facebook: "#1877f2",
  twitter: "#1da1f2",
  tiktok: "#ff0050",
  linkedin: "#0a66c2",
  youtube: "#ff0000",
  pinterest: "#e60023",
  threads: "#000000",
  snapchat: "#fffc00",
};

export const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "Twitter/X",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  pinterest: "Pinterest",
  threads: "Threads",
  snapchat: "Snapchat",
};
