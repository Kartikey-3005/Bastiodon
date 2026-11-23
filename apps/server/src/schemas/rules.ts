import { z } from "zod";

export const UpdateRulesSchema = z.object({
  blockAdult: z.boolean().optional(),
  blockStreaming: z.boolean().optional(),
  blockGaming: z.boolean().optional(),
  scanChats: z.boolean().optional(),
  lockIncognito: z.boolean().optional(),
  customDomains: z.array(z.string()).optional()
});

export const SingleScanEventSchema = z.object({
  eventType: z.enum(["URL_VISIT", "BLOCKED_DOMAIN", "CHAT_ALERT", "SEARCH_ALERT", "INCOGNITO_ATTEMPT"]),
  source: z.string().min(1),
  snippet: z.string().default(""),
  severity: z.enum(["SAFE", "WARNING", "CRITICAL"]).default("SAFE"),
  timestamp: z.string().datetime().optional()
});

export const IngestEventsSchema = z.union([
  SingleScanEventSchema,
  z.array(SingleScanEventSchema),
  z.object({ events: z.array(SingleScanEventSchema) })
]);

export const HeartbeatSchema = z.object({
  incognitoLocked: z.boolean().optional()
});

export const EodSyncSchema = z.object({
  date: z.string().optional(),
  totalHours: z.number().nonnegative().default(0),
  domainReach: z.number().int().nonnegative().default(0),
  hourlyActivityJson: z.any().optional(),
  categoryBreakdownJson: z.any().optional(),
  blocksCount: z.number().int().nonnegative().default(0),
  alertsCount: z.number().int().nonnegative().default(0)
});
