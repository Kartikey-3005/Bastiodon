export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export interface Plan {
  id: string;
  name: string;
  tier: "BASIC" | "PRO" | "ULTIMATE";
  priceInr: number;
  maxDevices: number;
  popular: boolean;
  features: string[];
}

export interface ChildDevice {
  id: string;
  childName: string;
  pairingCode: string;
  isOnline: boolean;
  incognitoBlocked: boolean;
  lastSeenAt: string;
  createdAt: string;
  blockingRule?: {
    blockAdult: boolean;
    blockStreaming: boolean;
    blockGaming: boolean;
    customBlockedDomains: string;
  };
}

export interface ScanLog {
  id: string;
  deviceId: string;
  url: string;
  domain: string;
  contentType: "URL" | "SEARCH_QUERY" | "IN_GAME_CHAT" | "WEB_MESSAGE";
  snippet: string;
  severity: "SAFE" | "WARNING" | "CRITICAL_ILLEGAL";
  actionTaken: "ALLOWED" | "BLOCKED" | "FLAGGED";
  timestamp: string;
}

export interface DailyReport {
  id: string;
  deviceId: string;
  date: string;
  totalScreenTimeMins: number;
  totalSitesVisited: number;
  blockedAttemptsCount: number;
  flaggedMessagesCount: number;
  topDomains: { domain: string; count: number; minutes: number }[];
  categoryBreakdown: {
    safe?: number;
    blocked?: number;
    flagged?: number;
    warning?: number;
    critical?: number;
  };
}

