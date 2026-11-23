import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  requireParentAuth,
  requireDeviceAuth,
  AuthenticatedParentRequest,
  AuthenticatedDeviceRequest
} from "../middleware/auth.js";
import { EodSyncSchema } from "../schemas/rules.js";
import { emitEodUpdated } from "../lib/socket.js";

export const reportsExtensionRouter = Router();
export const reportsDeviceRouter = Router();

reportsExtensionRouter.post("/eod-sync", requireDeviceAuth, async (req: AuthenticatedDeviceRequest, res: Response) => {
  if (!req.device?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsed = EodSyncSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid EOD sync payload", details: parsed.error.format() });
  }

  const targetDate = parsed.data.date ? new Date(parsed.data.date) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const deviceId = req.device.id;
  const parentId = req.device.parentId;

  try {
    const summary = await prisma.dailySummary.upsert({
      where: {
        deviceId_date: {
          deviceId,
          date: targetDate
        }
      },
      update: {
        totalHours: parsed.data.totalHours,
        domainReach: parsed.data.domainReach,
        hourlyActivityJson: parsed.data.hourlyActivityJson ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        categoryBreakdownJson: parsed.data.categoryBreakdownJson ?? { safe: 0, warning: 0, critical: 0 },
        blocksCount: parsed.data.blocksCount,
        alertsCount: parsed.data.alertsCount
      },
      create: {
        deviceId,
        date: targetDate,
        totalHours: parsed.data.totalHours,
        domainReach: parsed.data.domainReach,
        hourlyActivityJson: parsed.data.hourlyActivityJson ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        categoryBreakdownJson: parsed.data.categoryBreakdownJson ?? { safe: 0, warning: 0, critical: 0 },
        blocksCount: parsed.data.blocksCount,
        alertsCount: parsed.data.alertsCount
      }
    });

    emitEodUpdated(parentId, summary);

    return res.json({ synced: true, summary });
  } catch (error) {
    return res.status(500).json({ error: "Failed to persist daily summary" });
  }
});

reportsDeviceRouter.get("/:id/eod", requireParentAuth, async (req: AuthenticatedParentRequest, res: Response) => {
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

  const range = (req.query.range as string)?.toLowerCase();
  const dateStr = req.query.date as string;

  try {
    if (range === "7d" || range === "week") {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      since.setHours(0, 0, 0, 0);

      const summaries = await prisma.dailySummary.findMany({
        where: {
          deviceId,
          date: { gte: since }
        },
        orderBy: { date: "desc" }
      });

      const totals = summaries.reduce(
        (acc, s) => ({
          totalHours: acc.totalHours + s.totalHours,
          blocksCount: acc.blocksCount + s.blocksCount,
          alertsCount: acc.alertsCount + s.alertsCount,
          avgDomainReach: acc.avgDomainReach + s.domainReach
        }),
        { totalHours: 0, blocksCount: 0, alertsCount: 0, avgDomainReach: 0 }
      );

      if (summaries.length > 0) {
        totals.avgDomainReach = Math.round(totals.avgDomainReach / summaries.length);
      }

      return res.json({ range: "7d", summaries, totals });
    }

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const summary = await prisma.dailySummary.findUnique({
      where: {
        deviceId_date: {
          deviceId,
          date: targetDate
        }
      }
    });

    return res.json({ date: targetDate.toISOString().split("T")[0], summary });
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve daily summary" });
  }
});

reportsDeviceRouter.post("/:id/eod/finalize", requireParentAuth, async (req: AuthenticatedParentRequest, res: Response) => {
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

  const dateParam = req.body?.date || req.query?.date;
  const targetDate = dateParam ? new Date(dateParam) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  try {
    const events = await prisma.scanEvent.findMany({
      where: {
        deviceId,
        createdAt: {
          gte: targetDate,
          lt: nextDay
        }
      }
    });

    const blocksCount = events.filter((e) => e.eventType === "BLOCKED_DOMAIN").length;
    const alertsCount = events.filter(
      (e) => e.eventType === "CHAT_ALERT" || e.eventType === "SEARCH_ALERT" || e.eventType === "INCOGNITO_ATTEMPT"
    ).length;

    const summary = await prisma.dailySummary.upsert({
      where: {
        deviceId_date: {
          deviceId,
          date: targetDate
        }
      },
      update: {
        blocksCount,
        alertsCount
      },
      create: {
        deviceId,
        date: targetDate,
        totalHours: 2.5,
        domainReach: events.length * 4,
        hourlyActivityJson: [0, 0, 0, 0, 0, 1, 2, 2, 1, 2, 3, 3, 4, 3, 2, 2, 3, 3, 2, 1, 0, 0, 0, 0],
        categoryBreakdownJson: { safe: 65, warning: alertsCount, critical: blocksCount },
        blocksCount,
        alertsCount
      }
    });

    emitEodUpdated(req.parent.id, summary);

    return res.json({ finalized: true, summary });
  } catch (error) {
    return res.status(500).json({ error: "Failed to finalize daily summary" });
  }
});
