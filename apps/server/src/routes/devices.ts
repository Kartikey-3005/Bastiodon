import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { generateDeviceToken } from "../auth.js";
import {
  requireParentAuth,
  requireDeviceAuth,
  AuthenticatedParentRequest,
  AuthenticatedDeviceRequest
} from "../middleware/auth.js";
import {
  CreatePairingCodeSchema,
  PairDeviceSchema,
  DeleteDeviceSchema
} from "../schemas/auth.js";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "BST";
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const deviceRouter = Router();
export const extensionRouter = Router();

deviceRouter.get("/", requireParentAuth, async (req: AuthenticatedParentRequest, res: Response) => {
  if (!req.parent?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const devices = await prisma.childDevice.findMany({
      where: { parentId: req.parent.id },
      include: {
        rules: true,
        summaries: {
          orderBy: { date: "desc" },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json({ devices });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch devices" });
  }
});

deviceRouter.post("/pairing-code", requireParentAuth, async (req: AuthenticatedParentRequest, res: Response) => {
  if (!req.parent?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsed = CreatePairingCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid pairing code request" });
  }

  const childName = parsed.data.name || "Child's Device";
  const browser = parsed.data.browser || "Chrome";

  try {
    let pairingCode = generateCode();
    let collision = await prisma.childDevice.findUnique({ where: { pairingCode } });
    while (collision) {
      pairingCode = generateCode();
      collision = await prisma.childDevice.findUnique({ where: { pairingCode } });
    }

    const deviceToken = "dtk_" + crypto.randomBytes(24).toString("hex");

    const device = await prisma.childDevice.create({
      data: {
        parentId: req.parent.id,
        name: childName,
        browser,
        pairingCode,
        deviceToken,
        isOnline: false,
        incognitoLocked: true,
        rules: {
          create: {
            blockAdult: true,
            blockStreaming: true,
            blockGaming: false,
            scanChats: true,
            lockIncognito: true,
            customDomains: []
          }
        }
      },
      include: {
        rules: true
      }
    });

    return res.status(201).json({
      device,
      pairingCode: device.pairingCode
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create pairing code" });
  }
});

deviceRouter.delete("/:id", requireParentAuth, async (req: AuthenticatedParentRequest, res: Response) => {
  if (!req.parent?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const pinFromBody = req.body?.pin || req.headers["x-parent-pin"];
  const parsed = DeleteDeviceSchema.safeParse({ pin: pinFromBody });

  if (!parsed.success) {
    return res.status(400).json({ error: "6-digit Parent PIN required to delete device" });
  }

  const isPinValid = await bcrypt.compare(parsed.data.pin, req.parent.pinHash);
  if (!isPinValid) {
    return res.status(403).json({ error: "Invalid Parent PIN" });
  }

  const deviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const existing = await prisma.childDevice.findFirst({
      where: {
        id: deviceId,
        parentId: req.parent.id
      }
    });

    if (!existing) {
      return res.status(404).json({ error: "Device not found or not owned by parent" });
    }

    await prisma.childDevice.delete({
      where: { id: deviceId }
    });

    return res.json({ deleted: true, deviceId });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete device" });
  }
});

extensionRouter.post("/pair", async (req, res: Response) => {
  const parsed = PairDeviceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid pairing request", details: parsed.error.format() });
  }

  const { pairingCode, name, browser } = parsed.data;

  try {
    const device = await prisma.childDevice.findUnique({
      where: { pairingCode },
      include: { rules: true }
    });

    if (!device) {
      return res.status(404).json({ error: "Invalid pairing code" });
    }

    const deviceToken = device.deviceToken || generateDeviceToken({
      deviceId: device.id,
      parentId: device.parentId,
      childName: device.name,
      role: "DEVICE"
    });

    const updatedDevice = await prisma.childDevice.update({
      where: { id: device.id },
      data: {
        deviceToken,
        isOnline: true,
        lastSeenAt: new Date(),
        name: name || device.name,
        browser: browser || device.browser
      },
      include: { rules: true }
    });

    return res.json({
      device: updatedDevice,
      deviceToken,
      rules: updatedDevice.rules
    });
  } catch (error) {
    return res.status(500).json({ error: "Device pairing failed" });
  }
});
