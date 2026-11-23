import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  requireParentAuth,
  requireDeviceAuth,
  AuthenticatedParentRequest,
  AuthenticatedDeviceRequest
} from "../middleware/auth.js";
import { HeartbeatSchema, IngestEventsSchema } from "../schemas/rules.js";
import { emitDeviceStatus, emitNewScanEvent } from "../lib/socket.js";
import { ScanEventType, ScanSeverity } from "../generated/client/index.js";

export const scannerExtensionRouter = Router();
export const scannerDeviceRouter = Router();

scannerExtensionRouter.post("/heartbeat", requireDeviceAuth, async (req: AuthenticatedDeviceRequest, res: Response) => {
  if (!req.device?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsed = HeartbeatSchema.safeParse(req.body);
  const now = new Date();

  try {
    const updated = await prisma.childDevice.update({
      where: { id: req.device.id },
      data: {
        isOnline: true,
        lastSeenAt: now,
        ...(parsed.success && parsed.data.incognitoLocked !== undefined && {
          incognitoLocked: parsed.data.incognitoLocked
        })
      }
    });

    emitDeviceStatus(req.device.parentId, {
      deviceId: updated.id,
      isOnline: true,
      lastSeenAt: now
    });

    return res.json({ status: "alive", timestamp: now.toISOString() });
  } catch (error) {
    return res.status(500).json({ error: "Failed to record heartbeat" });
  }
});

scannerExtensionRouter.post("/events", requireDeviceAuth, async (req: AuthenticatedDeviceRequest, res: Response) => {
  if (!req.device?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsed = IngestEventsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid event data", details: parsed.error.format() });
  }

  let eventList: any[] = [];
  if (Array.isArray(parsed.data)) {
    eventList = parsed.data;
  } else if ("events" in parsed.data && Array.isArray(parsed.data.events)) {
    eventList = parsed.data.events;
  } else {
    eventList = [parsed.data];
  }

  const deviceId = req.device.id;
  const parentId = req.device.parentId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const createdEvents = [];
    let newBlocks = 0;
    let newAlerts = 0;

    for (const ev of eventList) {
      const created = await prisma.scanEvent.create({
        data: {
          deviceId,
          eventType: ev.eventType as ScanEventType,
          source: ev.source,
          snippet: ev.snippet || "",
          severity: (ev.severity as ScanSeverity) || ScanSeverity.SAFE,
          createdAt: ev.timestamp ? new Date(ev.timestamp) : new Date()
        }
      });

      if (ev.eventType === "BLOCKED_DOMAIN") {
        newBlocks++;
      } else if (ev.eventType === "CHAT_ALERT" || ev.eventType === "SEARCH_ALERT" || ev.eventType === "INCOGNITO_ATTEMPT") {
        newAlerts++;
      }

      createdEvents.push(created);
      emitNewScanEvent(parentId, created);
    }

    const existingSummary = await prisma.dailySummary.findUnique({
      where: {
        deviceId_date: {
          deviceId,
          date: today
        }
      }
    });

    if (existingSummary) {
      await prisma.dailySummary.update({
        where: { id: existingSummary.id },
        data: {
          blocksCount: existingSummary.blocksCount + newBlocks,
          alertsCount: existingSummary.alertsCount + newAlerts
        }
      });
    } else {
      await prisma.dailySummary.create({
        data: {
          deviceId,
          date: today,
          totalHours: 0,
          domainReach: 0,
          hourlyActivityJson: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          categoryBreakdownJson: { safe: 0, warning: newAlerts, critical: newBlocks },
          blocksCount: newBlocks,
          alertsCount: newAlerts
        }
      });
    }

    return res.status(201).json({ ingested: createdEvents.length, events: createdEvents });
  } catch (error) {
    return res.status(500).json({ error: "Failed to store events" });
  }
});

scannerDeviceRouter.get("/:id/events", requireParentAuth, async (req: AuthenticatedParentRequest, res: Response) => {
  const deviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!req.parent?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const device = await prisma.childDevice.findFirst({
    where: { id: deviceId, parentId: req.parent.id }
  });

  if (!device) {
    return res.status(404).json({ error: "Device not found" });
  }

  const filter = (req.query.filter as string)?.toUpperCase() || "ALL";
  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 200);

  let whereClause: any = { deviceId };

  if (filter === "BLOCKED") {
    whereClause.eventType = "BLOCKED_DOMAIN";
  } else if (filter === "ALERTS" || filter === "ALERT") {
    whereClause.eventType = { in: ["CHAT_ALERT", "SEARCH_ALERT", "INCOGNITO_ATTEMPT"] };
  } else if (filter === "SAFE") {
    whereClause.severity = "SAFE";
  }

  try {
    const events = await prisma.scanEvent.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return res.json({ events });
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve events" });
  }
});
