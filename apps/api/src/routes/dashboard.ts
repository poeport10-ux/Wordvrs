import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();

// Aggregate stats for the Writer dashboard. Revenue/analytics are computed from
// real purchase & subscription records; deeper analytics (sales trends, marketing
// attribution) are intentionally out of scope for this MVP and surfaced as "coming soon"
// in the UI rather than faked here.
dashboardRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authorId = req.userId!;

    const [bookCount, draftCount, publishedCount, followerCount, subscriberCount, purchases, subscriptions, unreadNotifications] =
      await Promise.all([
        prisma.book.count({ where: { authorId } }),
        prisma.book.count({ where: { authorId, status: "DRAFT" } }),
        prisma.book.count({ where: { authorId, status: "PUBLISHED" } }),
        prisma.follow.count({ where: { followingId: authorId } }),
        prisma.subscription.count({ where: { authorId, status: "ACTIVE" } }),
        prisma.purchase.findMany({ where: { book: { authorId } }, select: { priceCents: true } }),
        prisma.subscription.findMany({ where: { authorId, status: "ACTIVE" }, select: { priceCents: true } }),
        prisma.notification.count({ where: { userId: authorId, read: false } }),
      ]);

    const purchaseRevenueCents = purchases.reduce((sum, p) => sum + p.priceCents, 0);
    const monthlySubscriptionRevenueCents = subscriptions.reduce((sum, s) => sum + s.priceCents, 0);

    res.json({
      books: bookCount,
      drafts: draftCount,
      published: publishedCount,
      followers: followerCount,
      subscribers: subscriberCount,
      unreadNotifications,
      revenue: {
        totalPurchaseRevenueCents: purchaseRevenueCents,
        monthlyRecurringRevenueCents: monthlySubscriptionRevenueCents,
      },
    });
  })
);
