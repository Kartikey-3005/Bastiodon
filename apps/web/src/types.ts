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
  name?: string;
  browser?: string;
  pairingCode: string;
  isOnline: boolean;
  incognitoBlocked?: boolean;
  incognitoLocked?: boolean;
  lastSeenAt: string;
  createdAt: string;
  rules?: {
    blockAdult: boolean;
    blockStreaming: boolean;
    blockGaming: boolean;
    scanChats: boolean;
    lockIncognito: boolean;
    customDomains: string[];
  };
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
  url?: string;
  domain?: string;
  source?: string;
  eventType?: string;
  contentType?: "URL" | "SEARCH_QUERY" | "IN_GAME_CHAT" | "WEB_MESSAGE";
  snippet: string;
  severity: "SAFE" | "WARNING" | "CRITICAL_ILLEGAL" | "CRITICAL";
  actionTaken: "ALLOWED" | "BLOCKED" | "FLAGGED";
  timestamp: string;
  createdAt?: string;
}

export interface DailyReport {
  id: string;
  deviceId: string;
  date: string;
  totalHours?: number;
  domainReach?: number;
  totalScreenTimeMins?: number;
  totalSitesVisited?: number;
  blockedAttemptsCount?: number;
  flaggedMessagesCount?: number;
  blocksCount?: number;
  alertsCount?: number;
  hourlyActivityJson?: any;
  categoryBreakdownJson?: any;
  topDomains?: { domain: string; count: number; minutes: number }[];
}
