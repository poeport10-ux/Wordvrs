import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import type { NotificationType } from "@prisma/client";

export function notify(userId: string, type: NotificationType, payload: Record<string, unknown> = {}) {
  return prisma.notification.create({
    data: { userId, type, payload: payload as Prisma.InputJsonValue },
  });
}
