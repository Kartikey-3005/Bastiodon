import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { emitDeviceStatus } from "../lib/socket.js";

export function startEodCronJob() {
  cron.schedule("55 23 * * *", async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    try {
      const devices = await prisma.childDevice.findMany();

      for (const dev of devices) {
        const events = await prisma.scanEvent.findMany({
          where: {
            deviceId: dev.id,
            createdAt: {
              gte: today,
              lt: tomorrow
            }
          }
        });

        const blocksCount = events.filter((e) => e.eventType === "BLOCKED_DOMAIN").length;
        const alertsCount = events.filter(
          (e) => e.eventType === "CHAT_ALERT" || e.eventType === "SEARCH_ALERT" || e.eventType === "INCOGNITO_ATTEMPT"
        ).length;

        await prisma.dailySummary.upsert({
          where: {
            deviceId_date: {
              deviceId: dev.id,
              date: today
            }
          },
          update: {
            blocksCount,
            alertsCount
          },
          create: {
            deviceId: dev.id,
            date: today,
            totalHours: 2.0,
            domainReach: events.length * 3,
            hourlyActivityJson: [0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 3, 3, 3, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0],
            categoryBreakdownJson: { safe: 70, warning: alertsCount, critical: blocksCount },
            blocksCount,
            alertsCount
          }
        });

        if (dev.isOnline && dev.lastSeenAt < fiveMinutesAgo) {
          await prisma.childDevice.update({
            where: { id: dev.id },
            data: { isOnline: false }
          });

          emitDeviceStatus(dev.parentId, {
            deviceId: dev.id,
            isOnline: false,
            lastSeenAt: dev.lastSeenAt
          });
        }
      }
    } catch (err) {
      console.error("EOD Cron execution error:", err);
    }
  });
}
