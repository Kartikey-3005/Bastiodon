import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  requireParentAuth,
  requireDeviceAuth,
  AuthenticatedParentRequest,
  AuthenticatedDeviceRequest
} from "../middleware/auth.js";
import { UpdateRulesSchema } from "../schemas/rules.js";
import { emitRulesUpdated } from "../lib/socket.js";

const router = Router({ mergeParams: true });

router.get("/:id/rules", async (req: any, res: Response) => {
  const deviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const authHeader = req.headers.authorization;
  const deviceHeaderToken = req.headers["x-device-token"];

  let isAuthorized = false;

  if (deviceHeaderToken || (authHeader && !authHeader.startsWith("Bearer "))) {
    return res.status(401).json({ error: "Invalid authorization header" });
  }

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const parentMiddleware = () =>
        new Promise<boolean>((resolve) => {
          requireParentAuth(req as AuthenticatedParentRequest, res, () => resolve(true));
        });

      const isParent = await parentMiddleware();
      if (isParent && req.parent?.id) {
        const dev = await prisma.childDevice.findFirst({
          where: { id: deviceId, parentId: req.parent.id }
        });
        if (dev) isAuthorized = true;
      }
    } catch { }

    if (!isAuthorized) {
      try {
        const deviceMiddleware = () =>
          new Promise<boolean>((resolve) => {
            requireDeviceAuth(req as AuthenticatedDeviceRequest, res, () => resolve(true));
          });

        const isDevice = await deviceMiddleware();
        if (isDevice && req.device?.id === deviceId) {
          isAuthorized = true;
        }
      } catch { }
    }
  }

  if (!isAuthorized) {
    return res.status(403).json({ error: "Access denied to device rules" });
  }

  try {
    const rule = await prisma.blockingRule.findUnique({
      where: { deviceId }
    });

    if (!rule) {
      const newRule = await prisma.blockingRule.create({
        data: {
          deviceId,
          blockAdult: true,
          blockStreaming: true,
          blockGaming: false,
          scanChats: true,
          lockIncognito: true,
          customDomains: []
        }
      });
      return res.json({ rule: newRule });
    }

    return res.json({ rule });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch rules" });
  }
});

router.patch("/:id/rules", requireParentAuth, async (req: AuthenticatedParentRequest, res: Response) => {
  const deviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!req.parent?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const device = await prisma.childDevice.findFirst({
    where: { id: deviceId, parentId: req.parent.id }
  });

  if (!device) {
    return res.status(404).json({ error: "Device not found or not owned by parent" });
  }

  const parsed = UpdateRulesSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid rules update data", details: parsed.error.format() });
  }

  const {
    blockAdult,
    blockStreaming,
    blockGaming,
    scanChats,
    lockIncognito,
    customDomains
  } = parsed.data;

  try {
    const updatedRule = await prisma.blockingRule.upsert({
      where: { deviceId },
      update: {
        ...(blockAdult !== undefined && { blockAdult }),
        ...(blockStreaming !== undefined && { blockStreaming }),
        ...(blockGaming !== undefined && { blockGaming }),
        ...(scanChats !== undefined && { scanChats }),
        ...(lockIncognito !== undefined && { lockIncognito }),
        ...(customDomains !== undefined && { customDomains })
      },
      create: {
        deviceId,
        blockAdult: blockAdult ?? true,
        blockStreaming: blockStreaming ?? true,
        blockGaming: blockGaming ?? false,
        scanChats: scanChats ?? true,
        lockIncognito: lockIncognito ?? true,
        customDomains: customDomains ?? []
      }
    });

    if (lockIncognito !== undefined) {
      await prisma.childDevice.update({
        where: { id: deviceId },
        data: { incognitoLocked: lockIncognito }
      });
    }

    emitRulesUpdated(deviceId, req.parent.id, updatedRule);

    return res.json({ rule: updatedRule });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update rules" });
  }
});

export default router;
