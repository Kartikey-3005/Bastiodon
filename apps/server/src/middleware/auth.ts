import { Request, Response, NextFunction } from "express";
import { verifyToken, ParentTokenPayload, DeviceTokenPayload } from "../auth.js";
import { prisma as serverPrisma } from "../lib/prisma.js";

export interface AuthenticatedParentRequest extends Request {
  parent?: {
    id: string;
    email: string;
    plan: string;
    pinHash: string;
  };
}

export interface AuthenticatedDeviceRequest extends Request {
  device?: {
    id: string;
    parentId: string;
    name: string;
    pairingCode: string;
    deviceToken: string;
    isOnline: boolean;
    incognitoLocked: boolean;
    lastSeenAt: Date;
  };
}

export async function requireParentAuth(
  req: AuthenticatedParentRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token) as ParentTokenPayload | null;

  if (!payload || payload.role !== "PARENT") {
    return res.status(401).json({ error: "Unauthorized parent token" });
  }

  try {
    const user = await serverPrisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      return res.status(401).json({ error: "Parent user not found" });
    }

    req.parent = {
      id: user.id,
      email: user.email,
      plan: user.plan,
      pinHash: user.pinHash
    };

    next();
  } catch (error) {
    return res.status(500).json({ error: "Authentication verification failed" });
  }
}

export async function requireDeviceAuth(
  req: AuthenticatedDeviceRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const headerToken = (req.headers["x-device-token"] as string) || (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

  if (!headerToken) {
    return res.status(401).json({ error: "Missing device token" });
  }

  const payload = verifyToken(headerToken) as DeviceTokenPayload | null;
  const tokenToLookup = payload?.deviceId ? null : headerToken;

  try {
    let device = null;
    if (payload?.deviceId) {
      device = await serverPrisma.childDevice.findUnique({
        where: { id: payload.deviceId }
      });
    } else if (tokenToLookup) {
      device = await serverPrisma.childDevice.findUnique({
        where: { deviceToken: tokenToLookup }
      });
    }

    if (!device) {
      return res.status(401).json({ error: "Unauthorized device token" });
    }

    req.device = {
      id: device.id,
      parentId: device.parentId,
      name: device.name,
      pairingCode: device.pairingCode,
      deviceToken: device.deviceToken,
      isOnline: device.isOnline,
      incognitoLocked: device.incognitoLocked,
      lastSeenAt: device.lastSeenAt
    };

    next();
  } catch (error) {
    return res.status(500).json({ error: "Device authentication verification failed" });
  }
}
