import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import bcrypt from "bcryptjs";
import cron from "node-cron";
import dotenv from "dotenv";
import path from "path";
import { prisma } from "@bastiodon/database";
import {
  generateParentToken,
  generateDeviceToken,
  verifyToken,
  ParentTokenPayload,
  DeviceTokenPayload
} from "./auth.js";
import {
  ADULT_DOMAINS,
  STREAMING_DOMAINS,
  GAMING_DOMAINS,
  analyzeContentSnippet
} from "./constants.js";

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const PORT = process.env.PORT || 4000;

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

function requireParentAuth(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token) as ParentTokenPayload | null;
  if (!payload || payload.role !== "PARENT") {
    return res.status(401).json({ error: "Unauthorized parent token" });
  }
  req.parent = payload;
  next();
}


function requireDeviceAuth(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid device authorization header" });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token) as DeviceTokenPayload | null;
  if (!payload || payload.role !== "DEVICE") {
    return res.status(401).json({ error: "Unauthorized device token" });
  }
  req.device = payload;
  next();
}






app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});


app.get("/api/plans", async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { priceInr: "asc" }
    });
    res.json({
      plans: plans.map((p: any) => ({
        ...p,
        features: JSON.parse(p.featuresJson || "[]")
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, pinCode, subscriptionTier } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required." });
    }

    const existing = await prisma.parentUser.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "A parent account with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const parent = await prisma.parentUser.create({
      data: {
        email,
        passwordHash,
        name,
        pinCode: pinCode || "1234",
        subscriptionTier: subscriptionTier || "PRO",
        subscriptionStatus: "ACTIVE"
      }
    });

    const token = generateParentToken({
      userId: parent.id,
      email: parent.email,
      role: "PARENT"
    });

    res.json({
      token,
      parent: {
        id: parent.id,
        email: parent.email,
        name: parent.name,
        pinCode: parent.pinCode,
        subscriptionTier: parent.subscriptionTier
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const parent = await prisma.parentUser.findUnique({
      where: { email },
      include: { children: true }
    });

    if (!parent) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, parent.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateParentToken({
      userId: parent.id,
      email: parent.email,
      role: "PARENT"
    });

    res.json({
      token,
      parent: {
        id: parent.id,
        email: parent.email,
        name: parent.name,
        pinCode: parent.pinCode,
        subscriptionTier: parent.subscriptionTier,
        childrenCount: parent.children.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/parent/verify-pin", requireParentAuth, async (req: any, res) => {
  try {
    const { pin } = req.body;
    const parent = await prisma.parentUser.findUnique({
      where: { id: req.parent.userId }
    });
    if (!parent) return res.status(404).json({ error: "Parent not found" });

    const isValid = parent.pinCode === pin;
    res.json({ valid: isValid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/devices/create", requireParentAuth, async (req: any, res) => {
  try {
    const { childName } = req.body;
    if (!childName) {
      return res.status(400).json({ error: "Child name is required." });
    }

    
    const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const device = await prisma.childDevice.create({
      data: {
        parentId: req.parent.userId,
        childName,
        pairingCode,
        isOnline: false,
        incognitoBlocked: true,
        blockingRule: {
          create: {
            blockAdult: true,
            blockStreaming: false,
            blockGaming: false,
            customBlockedDomains: "[]"
          }
        }
      },
      include: {
        blockingRule: true
      }
    });

    res.json({
      device: {
        id: device.id,
        childName: device.childName,
        pairingCode: device.pairingCode,
        incognitoBlocked: device.incognitoBlocked,
        blockingRule: device.blockingRule
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/api/devices", requireParentAuth, async (req: any, res) => {
  try {
    const devices = await prisma.childDevice.findMany({
      where: { parentId: req.parent.userId },
      include: {
        blockingRule: true,
        liveScanLogs: {
          take: 10,
          orderBy: { timestamp: "desc" }
        }
      }
    });
    res.json({ devices });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/extension/pair", async (req, res) => {
  try {
    const { pairingCode } = req.body;
    if (!pairingCode) {
      return res.status(400).json({ error: "Pairing code is required." });
    }

    const device = await prisma.childDevice.findUnique({
      where: { pairingCode: pairingCode.toUpperCase().trim() },
      include: {
        parent: true,
        blockingRule: true
      }
    });

    if (!device) {
      return res.status(404).json({ error: "Invalid pairing code. Please check code on Parent Dashboard." });
    }

    const deviceToken = generateDeviceToken({
      deviceId: device.id,
      parentId: device.parentId,
      childName: device.childName,
      role: "DEVICE"
    });

    
    await prisma.childDevice.update({
      where: { id: device.id },
      data: {
        deviceToken,
        isOnline: true,
        lastSeenAt: new Date()
      }
    });

    
    io.to(`parent:${device.parentId}`).emit("device:status", {
      deviceId: device.id,
      isOnline: true,
      lastSeenAt: new Date()
    });

    res.json({
      success: true,
      deviceToken,
      deviceId: device.id,
      childName: device.childName,
      parentId: device.parentId,
      blockingRule: device.blockingRule,
      incognitoBlocked: device.incognitoBlocked
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/extension/verify-pin", requireDeviceAuth, async (req: any, res) => {
  try {
    const { pin } = req.body;
    const device = await prisma.childDevice.findUnique({
      where: { id: req.device.deviceId },
      include: { parent: true }
    });

    if (!device || !device.parent) {
      return res.status(404).json({ error: "Device or Parent not found" });
    }

    const isMatch = device.parent.pinCode === pin;
    res.json({ valid: isMatch });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/api/extension/rules", requireDeviceAuth, async (req: any, res) => {
  try {
    const device = await prisma.childDevice.findUnique({
      where: { id: req.device.deviceId },
      include: { blockingRule: true }
    });

    if (!device) return res.status(404).json({ error: "Device not found" });

    const rule = device.blockingRule;
    const customList = JSON.parse(rule?.customBlockedDomains || "[]");

    let activeBlockedDomains: string[] = [];
    if (rule?.blockAdult) {
      activeBlockedDomains.push(...ADULT_DOMAINS);
    }
    if (rule?.blockStreaming) {
      activeBlockedDomains.push(...STREAMING_DOMAINS);
    }
    if (rule?.blockGaming) {
      activeBlockedDomains.push(...GAMING_DOMAINS);
    }
    activeBlockedDomains.push(...customList);

    
    activeBlockedDomains = Array.from(new Set(activeBlockedDomains));

    res.json({
      deviceId: device.id,
      incognitoBlocked: device.incognitoBlocked,
      rule,
      activeBlockedDomains
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.put("/api/rules/:deviceId", requireParentAuth, async (req: any, res) => {
  try {
    const { deviceId } = req.params;
    const { blockAdult, blockStreaming, blockGaming, customBlockedDomains, incognitoBlocked } = req.body;

    const device = await prisma.childDevice.findFirst({
      where: { id: deviceId, parentId: req.parent.userId }
    });

    if (!device) {
      return res.status(404).json({ error: "Device not found or not owned by you." });
    }

    if (incognitoBlocked !== undefined) {
      await prisma.childDevice.update({
        where: { id: deviceId },
        data: { incognitoBlocked }
      });
    }

    const updatedRule = await prisma.blockingRule.upsert({
      where: { deviceId },
      update: {
        ...(blockAdult !== undefined && { blockAdult }),
        ...(blockStreaming !== undefined && { blockStreaming }),
        ...(blockGaming !== undefined && { blockGaming }),
        ...(customBlockedDomains !== undefined && {
          customBlockedDomains: typeof customBlockedDomains === "string" ? customBlockedDomains : JSON.stringify(customBlockedDomains)
        })
      },
      create: {
        deviceId,
        blockAdult: blockAdult ?? true,
        blockStreaming: blockStreaming ?? false,
        blockGaming: blockGaming ?? false,
        customBlockedDomains: typeof customBlockedDomains === "string" ? customBlockedDomains : JSON.stringify(customBlockedDomains || [])
      }
    });

    
    io.to(`device:${deviceId}`).emit("rules:updated", {
      rule: updatedRule,
      incognitoBlocked
    });

    res.json({ success: true, rule: updatedRule });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/telemetry/event", requireDeviceAuth, async (req: any, res) => {
  try {
    const { url, domain, contentType, snippet, forceSeverity, forceAction } = req.body;
    const deviceId = req.device.deviceId;

    
    const analysis = analyzeContentSnippet(snippet || url || "");
    const severity = forceSeverity || analysis.severity;
    const actionTaken = forceAction || analysis.actionTaken;

    const log = await prisma.liveScanLog.create({
      data: {
        deviceId,
        url: url || "",
        domain: domain || "",
        contentType: contentType || "URL",
        snippet: snippet || url || "",
        severity,
        actionTaken
      }
    });

    
    io.to(`parent:${req.device.parentId}`).emit("telemetry:new", {
      deviceId,
      log
    });

    res.json({ success: true, log, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/api/telemetry/:deviceId", requireParentAuth, async (req: any, res) => {
  try {
    const { deviceId } = req.params;
    const logs = await prisma.liveScanLog.findMany({
      where: { deviceId },
      take: 100,
      orderBy: { timestamp: "desc" }
    });
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/reports/eod", requireDeviceAuth, async (req: any, res) => {
  try {
    const { date, totalScreenTimeMins, totalSitesVisited, blockedAttemptsCount, flaggedMessagesCount, topDomains, categoryBreakdown } = req.body;
    const deviceId = req.device.deviceId;
    const reportDate = date || new Date().toISOString().split("T")[0];

    const report = await prisma.dailySummaryReport.upsert({
      where: {
        deviceId_date: {
          deviceId,
          date: reportDate
        }
      },
      update: {
        totalScreenTimeMins: { increment: totalScreenTimeMins || 0 },
        totalSitesVisited: { increment: totalSitesVisited || 0 },
        blockedAttemptsCount: { increment: blockedAttemptsCount || 0 },
        flaggedMessagesCount: { increment: flaggedMessagesCount || 0 },
        ...(topDomains && { topDomainsJson: JSON.stringify(topDomains) }),
        ...(categoryBreakdown && { categoryBreakdownJson: JSON.stringify(categoryBreakdown) })
      },
      create: {
        deviceId,
        date: reportDate,
        totalScreenTimeMins: totalScreenTimeMins || 0,
        totalSitesVisited: totalSitesVisited || 0,
        blockedAttemptsCount: blockedAttemptsCount || 0,
        flaggedMessagesCount: flaggedMessagesCount || 0,
        topDomainsJson: JSON.stringify(topDomains || []),
        categoryBreakdownJson: JSON.stringify(categoryBreakdown || {})
      }
    });

    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/api/reports/:deviceId", requireParentAuth, async (req: any, res) => {
  try {
    const { deviceId } = req.params;
    const { date } = req.query;

    const query: any = { deviceId };
    if (date) {
      query.date = String(date);
    }

    const reports = await prisma.dailySummaryReport.findMany({
      where: query,
      orderBy: { date: "desc" }
    });

    res.json({
      reports: reports.map((r: any) => ({
        ...r,
        topDomains: JSON.parse(r.topDomainsJson || "[]"),
        categoryBreakdown: JSON.parse(r.categoryBreakdownJson || "{}")
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/api/tools/download-incognito-reg", (req, res) => {
  const regContent = `Windows Registry Editor Version 5.00

; ========================================================
; Bastiodon Parental Control: Enforce Incognito Lock
; ========================================================

; Google Chrome Incognito Disabled (1 = Disabled, 0 = Enabled, 2 = Forced)
[HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Google\\Chrome]
"IncognitoModeAvailability"=dword:00000001

; Microsoft Edge InPrivate Disabled (1 = Disabled)
[HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Edge]
"InPrivateModeAvailability"=dword:00000001

; Brave Browser Incognito Disabled
[HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\BraveSoftware\\Brave]
"IncognitoModeAvailability"=dword:00000001
`;
  res.setHeader("Content-Disposition", "attachment; filename=\"Bastiodon_Disable_Incognito.reg\"");
  res.setHeader("Content-Type", "application/octet-stream");
  res.send(regContent);
});




io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  
  socket.on("join:parent", ({ parentId, token }) => {
    if (parentId) {
      socket.join(`parent:${parentId}`);
      console.log(`Parent joined room: parent:${parentId}`);
    }
  });

  
  socket.on("join:device", async ({ deviceId, deviceToken }) => {
    if (deviceId) {
      socket.join(`device:${deviceId}`);
      console.log(`Device joined room: device:${deviceId}`);

      
      try {
        await prisma.childDevice.update({
          where: { id: deviceId },
          data: { isOnline: true, lastSeenAt: new Date() }
        });
      } catch (err) {}
    }
  });

  
  socket.on("stream:scan", async (data) => {
    const { deviceId, parentId, url, domain, contentType, snippet, severity, actionTaken } = data;
    try {
      const log = await prisma.liveScanLog.create({
        data: {
          deviceId,
          url: url || "",
          domain: domain || "",
          contentType: contentType || "URL",
          snippet: snippet || url || "",
          severity: severity || "SAFE",
          actionTaken: actionTaken || "ALLOWED"
        }
      });

      if (parentId) {
        io.to(`parent:${parentId}`).emit("telemetry:new", {
          deviceId,
          log
        });
      }
    } catch (err) {
      console.error("Error saving stream scan log:", err);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
  });
});




cron.schedule("55 23 * * *", async () => {
  console.log("[CRON] Running End-of-Day report aggregation at 23:55...");
  const today = new Date().toISOString().split("T")[0];
  try {
    const devices = await prisma.childDevice.findMany();
    for (const d of devices) {
      const logsToday = await prisma.liveScanLog.findMany({
        where: {
          deviceId: d.id,
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      const blockedCount = logsToday.filter((l: any) => l.actionTaken === "BLOCKED").length;
      const flaggedCount = logsToday.filter((l: any) => l.severity !== "SAFE").length;

      
      const domainMap: Record<string, number> = {};
      logsToday.forEach((l: any) => {
        if (l.domain) {
          domainMap[l.domain] = (domainMap[l.domain] || 0) + 1;
        }
      });

      const topDomains = Object.entries(domainMap)
        .map(([domain, count]) => ({ domain, count, minutes: count * 2 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      await prisma.dailySummaryReport.upsert({
        where: {
          deviceId_date: { deviceId: d.id, date: today }
        },
        update: {
          totalSitesVisited: logsToday.length,
          blockedAttemptsCount: blockedCount,
          flaggedMessagesCount: flaggedCount,
          topDomainsJson: JSON.stringify(topDomains)
        },
        create: {
          deviceId: d.id,
          date: today,
          totalScreenTimeMins: Math.min(logsToday.length * 2, 480),
          totalSitesVisited: logsToday.length,
          blockedAttemptsCount: blockedCount,
          flaggedMessagesCount: flaggedCount,
          topDomainsJson: JSON.stringify(topDomains),
          categoryBreakdownJson: JSON.stringify({
            safe: logsToday.filter((l: any) => l.severity === "SAFE").length,
            warning: flaggedCount,
            critical: logsToday.filter((l: any) => l.severity === "CRITICAL_ILLEGAL").length
          })
        }
      });
    }
    console.log("[CRON] EOD summary aggregated for all active devices.");
  } catch (err) {
    console.error("[CRON Error]:", err);
  }
});

server.listen(PORT, () => {
  console.log(`[Bastiodon Server] Running on port ${PORT}`);
  console.log(`[Bastiodon WebSocket] Ready for real-time telemetry`);
});


