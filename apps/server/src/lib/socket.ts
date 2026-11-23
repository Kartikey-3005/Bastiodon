import { Server as SocketIOServer, Socket } from "socket.io";
import { verifyToken, ParentTokenPayload, DeviceTokenPayload } from "../auth.js";

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(io: SocketIOServer) {
  ioInstance = io;

  io.on("connection", (socket: Socket) => {
    socket.on("join:parent", (data: { token?: string; parentId?: string }) => {
      let resolvedParentId = data?.parentId;
      if (data?.token) {
        const payload = verifyToken(data.token) as ParentTokenPayload | null;
        if (payload?.userId) {
          resolvedParentId = payload.userId;
        }
      }
      if (resolvedParentId) {
        socket.join(`parent:${resolvedParentId}`);
      }
    });

    socket.on("join:device", (data: { deviceToken?: string; deviceId?: string }) => {
      let resolvedDeviceId = data?.deviceId;
      if (data?.deviceToken) {
        const payload = verifyToken(data.deviceToken) as DeviceTokenPayload | null;
        if (payload?.deviceId) {
          resolvedDeviceId = payload.deviceId;
        }
      }
      if (resolvedDeviceId) {
        socket.join(`device:${resolvedDeviceId}`);
      }
    });
  });
}

export function emitNewScanEvent(parentId: string, event: any) {
  if (ioInstance) {
    ioInstance.to(`parent:${parentId}`).emit("scanner:new_event", event);
  }
}

export function emitRulesUpdated(deviceId: string, parentId: string, rules: any) {
  if (ioInstance) {
    ioInstance.to(`device:${deviceId}`).emit("rules:updated", rules);
    ioInstance.to(`parent:${parentId}`).emit("rules:updated", rules);
  }
}

export function emitDeviceStatus(parentId: string, status: { deviceId: string; isOnline: boolean; lastSeenAt: Date | string }) {
  if (ioInstance) {
    ioInstance.to(`parent:${parentId}`).emit("device:status", status);
  }
}

export function emitEodUpdated(parentId: string, summary: any) {
  if (ioInstance) {
    ioInstance.to(`parent:${parentId}`).emit("eod:updated", summary);
  }
}
