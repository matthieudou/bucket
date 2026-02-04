import { v } from "convex/values";
import { mutation, query } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return ctx.db
      .query("tiles")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .order("desc")
      .take(24);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated");
    }
    return ctx.storage.generateUploadUrl();
  },
});

export const createImageTile = mutation({
  args: {
    storageId: v.id("_storage"),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
    size: v.object({
      w: v.number(),
      h: v.number(),
    }),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated");
    }

    const imageUrl = await ctx.storage.getUrl(args.storageId);

    return ctx.db.insert("tiles", {
      ownerId: userId,
      type: "image",
      imageStorageId: args.storageId,
      imageUrl: imageUrl ?? undefined,
      position: args.position,
      size: args.size,
      title: args.title,
      createdAt: Date.now(),
    });
  },
});
