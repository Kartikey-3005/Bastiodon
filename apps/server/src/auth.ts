import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "bastiodon_super_secret_jwt_key_2026";

export interface ParentTokenPayload {
  userId: string;
  email: string;
  role: "PARENT";
}

export interface DeviceTokenPayload {
  deviceId: string;
  parentId: string;
  childName: string;
  role: "DEVICE";
}

export function generateParentToken(payload: ParentTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function generateDeviceToken(payload: DeviceTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "365d" });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

